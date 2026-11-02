import { useRef, useState, useMemo, useLayoutEffect } from 'react';
import { feedbackAPI } from '../services/api';

export const RECOMMENDATION_CHOICES = {
  helpful: { feedback_type: 'rec_rating', rating: 1, label: 'Helpful' },
  too_easy: { feedback_type: 'too_easy', label: 'Too easy' },
  too_hard: { feedback_type: 'too_hard', label: 'Too hard' },
  not_relevant: { feedback_type: 'not_relevant', label: 'Not relevant' },
};
export const canRateRecommendation = (id) => Number.isSafeInteger(id) && id > 0;
const isRecommendationFeedback = (item) => ['rec_rating', 'too_easy', 'too_hard', 'not_relevant'].includes(item?.feedback_type);
const choiceFor = (item) => item.feedback_type === 'rec_rating'
  ? (item.rating === 1 ? 'helpful' : null) : item.feedback_type;

// Lives at App level, so changing tabs does not discard successful submissions.
// No localStorage: feedback and in-flight operations belong to one login session.
export function useRecommendationFeedback(sessionKey) {
  const session = useMemo(() => ({ key: sessionKey, entries: new Map() }), [sessionKey]);
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

  // Check paginated history, not just the most recent 50 records. Fail closed
  // if the history cannot be verified within the bounded scan.
  const findExisting = async (id) => {
    for (let skip = 0; skip < 10000; skip += 100) {
      if (!active()) return undefined;
      const { data } = await feedbackAPI.getMyFeedback({ skip, limit: 100 }, session.key);
      if (!active()) return undefined;
      if (!Array.isArray(data)) throw new Error('Invalid feedback history');
      const found = data.find((item) => isRecommendationFeedback(item) && item.target_id === id);
      if (found) return found;
      if (data.length < 100) return null;
    }
    throw new Error('Feedback history limit reached');
  };

  const submit = async (id, choice) => {
    if (!active() || !canRateRecommendation(id) || !Object.hasOwn(RECOMMENDATION_CHOICES, choice)) return;
    const previous = session.entries.get(id);
    if (['pending', 'success'].includes(previous?.status)) return;
    // A failed transport may have committed. Rechecking is safe; resending is not.
    const uncertain = previous?.uncertain || false;
    update(id, { status: 'pending', choice, uncertain });
    let posting = false;
    try {
      const existing = await findExisting(id);
      if (!active()) return;
      if (existing) {
        update(id, { status: 'success', choice: choiceFor(existing), previouslySaved: true });
        return;
      }
      if (uncertain) {
        update(id, { status: 'error', choice, uncertain: true,
          text: 'Saving could not be confirmed. No feedback was resent to avoid duplicates. You can check again.' });
        return;
      }
      if (!active()) return;
      posting = true;
      const { feedback_type, rating } = RECOMMENDATION_CHOICES[choice];
      const payload = { feedback_type, target_id: id };
      if (rating !== undefined) payload.rating = rating;
      await feedbackAPI.submit(payload, session.key);
      update(id, { status: 'success', choice });
    } catch (error) {
      const status = error.response?.status;
      const ambiguous = uncertain || (posting && !(status >= 400 && status < 500 && status !== 408));
      update(id, { status: 'error', choice, uncertain: ambiguous,
        text: ambiguous ? 'Saving could not be confirmed. Check status before trying anything else.'
          : posting ? 'Feedback was not accepted. Retry when you are ready.'
            : 'Could not check previous feedback. Nothing was sent. Retry when you are ready.' });
    }
  };
  return { entries: session.entries, submit, authenticated: Boolean(session.key) };
}
