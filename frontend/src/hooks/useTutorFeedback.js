import { useRef, useState, useMemo, useLayoutEffect } from 'react';
import { feedbackAPI } from '../services/api';

export const canRateMessage = (message) => message.role === 'assistant'
  && Number.isSafeInteger(message.id) && message.id > 0
  && !message.streaming && !message.isCustomCard && !message.error;

export const canFlagMessage = (message) => message?.role === 'assistant'
  && typeof message.text === 'string' && Boolean(message.text.trim())
  && !message.streaming && !message.isCustomCard && !message.error;
// Only local UI identity, never a feedback target. Non-streaming fresh answer
// objects are retained by App across view remounts; saved answers use their ID.
export const tutorFlagKey = (message) => Number.isSafeInteger(message.id) && message.id > 0 ? message.id : message;

export const TUTOR_FLAG_COMMENT_MAX_LENGTH = 2000;
export const validateTutorFlagComment = (comment) => {
  if (typeof comment !== 'string' || !comment.trim()) return 'Describe what is incorrect before submitting.';
  if (comment.length > TUTOR_FLAG_COMMENT_MAX_LENGTH) return `Keep your comment to ${TUTOR_FLAG_COMMENT_MAX_LENGTH} characters or fewer.`;
  return '';
};

// Lives at App level, so changing tabs does not discard successful submissions.
// No localStorage: feedback and in-flight operations belong to one login session.
export function useTutorFeedback(sessionKey) {
  const session = useMemo(() => ({ key: sessionKey, entries: new Map(), flagEntries: new Map(), reportGuards: new Map(), scope: {} }), [sessionKey]);
  const current = useRef(session);
  const [, render] = useState(0);
  useLayoutEffect(() => {
    current.current = session;
    return () => { current.current = null; };
  }, [session]);
  const active = () => current.current === session && Boolean(session.key);
  const update = (id, value) => {
    if (!active()) return;
    session.entries.set(id, value);
    render((n) => n + 1);
  };

  // Check all pages, not just the most recent 50 ratings. Fail closed if the
  // history cannot be verified; an unlinked rating is never an acceptable fallback.
  const findExisting = async (id) => {
    for (let skip = 0; ; skip += 100) {
      if (!active()) return undefined;
      const { data } = await feedbackAPI.getMyFeedback({ skip, limit: 100 }, session.key);
      if (!active()) return undefined;
      if (!Array.isArray(data)) throw new Error('Invalid feedback history');
      const found = data.find((item) => item.feedback_type === 'tutor_rating' && item.target_id === id);
      if (found) return found;
      if (data.length < 100) return null;
    }
  };

  const submit = async (message, rating) => {
    if (!active() || !canRateMessage(message) || ![1, -1].includes(rating)) return;
    const previous = session.entries.get(message.id);
    if (['pending', 'success'].includes(previous?.status)) return;
    // A failed transport may have committed. Rechecking is safe; resending is not.
    const uncertain = previous?.uncertain || false;
    update(message.id, { status: 'pending', rating, uncertain });
    let posting = false;
    try {
      const existing = await findExisting(message.id);
      if (!active()) return;
      if (existing) {
        update(message.id, { status: 'success', rating: existing.rating });
        return;
      }
      if (uncertain) {
        update(message.id, { status: 'error', rating, uncertain: true,
          text: 'Saving could not be confirmed. No rating was resent to avoid duplicates. You can check again.' });
        return;
      }
      if (!active()) return;
      posting = true;
      await feedbackAPI.submit({ feedback_type: 'tutor_rating', target_id: message.id, rating }, session.key);
      update(message.id, { status: 'success', rating });
    } catch (error) {
      const status = error.response?.status;
      const ambiguous = uncertain || (posting && !(status >= 400 && status < 500 && status !== 408));
      update(message.id, { status: 'error', rating, uncertain: ambiguous,
        text: ambiguous ? 'Saving could not be confirmed. Check status before trying anything else.'
          : posting ? 'Rating was not accepted. Retry when you are ready.'
            : 'Could not check previous ratings. Nothing was sent. Retry when you are ready.' });
    }
  };

  const updateFlag = (id, value) => {
    if (!active()) return;
    session.flagEntries.set(id, value);
    render((n) => n + 1);
  };
  const submitFlag = async (message, comment) => {
    if (!active() || !canFlagMessage(message) || validateTutorFlagComment(comment)
      || session.reportGuards.has('uncertain') || session.reportGuards.has('pending')) return;
    const key = tutorFlagKey(message);
    const previous = session.flagEntries.get(key);
    if (['pending', 'success'].includes(previous?.status) || previous?.uncertain) return;
    const cleanedComment = comment.trim();
    // The message key is only a local duplicate guard. Bug feedback has no
    // reliable answer-link or idempotency contract, so never invent one.
    const pending = { status: 'pending', comment: cleanedComment };
    session.reportGuards.set('pending', pending);
    updateFlag(key, pending);
    try {
      await feedbackAPI.submit({ feedback_type: 'bug', comment: cleanedComment }, session.key);
      if (active()) session.reportGuards.delete('pending');
      updateFlag(key, { status: 'success', comment: cleanedComment });
    } catch (error) {
      const status = error?.response?.status;
      const uncertain = !(status >= 400 && status < 500 && status !== 408);
      const result = { status: 'error', comment: cleanedComment, uncertain,
        text: uncertain
          ? 'Sending could not be confirmed. Your general issue report may have been saved. Further reports are disabled in this session to avoid duplicates.'
          : 'Your report was not accepted. You can edit your comment and retry.' };
      // Without a linked target, a fresh answer may later reload with a saved
      // ID. Do not allow that identity change to bypass an ambiguous outcome.
      if (active()) {
        session.reportGuards.delete('pending');
        if (uncertain) session.reportGuards.set('uncertain', result);
      }
      updateFlag(key, result);
    }
  };
  return { entries: session.entries, submit, flagEntries: session.flagEntries, submitFlag,
    flagPending: session.reportGuards.get('pending'), flagUncertainty: session.reportGuards.get('uncertain'),
    authenticated: Boolean(session.key), sessionScope: session.scope };
}
