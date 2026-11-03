import React, { useCallback, useId, useLayoutEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { Flag, X } from 'lucide-react';
import { canFlagMessage, tutorFlagKey, TUTOR_FLAG_COMMENT_MAX_LENGTH, validateTutorFlagComment } from '../hooks/useTutorFeedback';
import './TutorFlag.css';

const locked = (state) => ['pending', 'success'].includes(state?.status) || state?.uncertain;
const statusText = (state) => state?.status === 'pending' ? 'Sending report…'
  : state?.status === 'success' ? 'Report submitted. Thank you!' : '';

function TutorFlagDialog({ message, feedback, state, initialComment, onClose, triggerRef }) {
  const id = useId();
  const dialogRef = useRef(null);
  const overlayRef = useRef(null);
  const commentRef = useRef(null);
  const closeRef = useRef(null);
  // A global pending/uncertain report may belong to another answer. Its body
  // is displayed read-only, never copied into this answer's editable draft.
  const [comment, setComment] = useState(initialComment);
  const [validation, setValidation] = useState('');
  const isLocked = locked(state);

  useLayoutEffect(() => {
    const dialog = dialogRef.current;
    const trigger = triggerRef.current;
    // The portal sits outside the app. Hide and disable its siblings while
    // preserving any pre-existing accessibility state for cleanup.
    const background = Array.from(document.body.children)
      .filter((element) => element !== overlayRef.current)
      .map((element) => ({ element, inert: element.getAttribute('inert'), hidden: element.getAttribute('aria-hidden') }));
    const overflow = document.body.style.overflow;
    background.forEach(({ element }) => { element.setAttribute('inert', ''); element.setAttribute('aria-hidden', 'true'); });
    document.body.style.overflow = 'hidden';
    const focusable = () => Array.from(dialog.querySelectorAll('button:not(:disabled), textarea:not(:disabled), [tabindex="0"]'));
    const focusInside = () => (commentRef.current || closeRef.current || dialog).focus();
    const handleKey = (event) => {
      if (event.key === 'Escape') {
        event.preventDefault();
        event.stopPropagation();
        onClose();
      } else if (event.key === 'Tab') {
        const controls = focusable();
        const first = controls[0] || dialog;
        const last = controls[controls.length - 1] || dialog;
        if (!dialog.contains(document.activeElement) || (event.shiftKey && document.activeElement === first)) {
          event.preventDefault();
          (event.shiftKey ? last : first).focus();
        } else if (!event.shiftKey && document.activeElement === last) {
          event.preventDefault();
          first.focus();
        }
      }
    };
    const handleFocus = (event) => { if (!dialog.contains(event.target)) focusInside(); };
    document.addEventListener('keydown', handleKey, true);
    document.addEventListener('focusin', handleFocus);
    focusInside();
    return () => {
      document.removeEventListener('keydown', handleKey, true);
      document.removeEventListener('focusin', handleFocus);
      background.forEach(({ element, inert, hidden }) => {
        if (inert === null) element.removeAttribute('inert'); else element.setAttribute('inert', inert);
        if (hidden === null) element.removeAttribute('aria-hidden'); else element.setAttribute('aria-hidden', hidden);
      });
      document.body.style.overflow = overflow;
      if (trigger?.isConnected && !trigger.closest('[inert]')) trigger.focus();
    };
  }, [triggerRef, onClose]);

  useLayoutEffect(() => {
    if (state?.status === 'success' || state?.status === 'pending' || state?.uncertain) closeRef.current?.focus();
  }, [state?.status, state?.uncertain]);

  const submit = (event) => {
    event.preventDefault();
    if (isLocked) return;
    const error = validateTutorFlagComment(comment);
    setValidation(error);
    if (error) { commentRef.current?.focus(); return; }
    feedback.submitFlag(message, comment);
  };

  return createPortal(<div className="tutor-flag-overlay" ref={overlayRef}>
    <section className="tutor-flag-dialog" role="dialog" aria-modal="true" aria-labelledby={`${id}-title`}
      aria-describedby={`${id}-description`} ref={dialogRef} tabIndex={-1}>
      <header>
        <h2 id={`${id}-title`}>Flag incorrect answer</h2>
        <button type="button" aria-label="Close report dialog" ref={closeRef} onClick={onClose}><X size={18} aria-hidden="true" /></button>
      </header>
      <p id={`${id}-description`}>This sends a general issue report. The answer and its message ID are not attached automatically. Describe the answer and what is incorrect in your comment.</p>
      <form onSubmit={submit} noValidate>
        {state?.status !== 'success' && <>
          <label htmlFor={`${id}-comment`}>What is incorrect?</label>
          <textarea id={`${id}-comment`} ref={commentRef} rows={5} value={isLocked ? state.comment : comment} readOnly={!!isLocked}
            required maxLength={TUTOR_FLAG_COMMENT_MAX_LENGTH} aria-invalid={!!validation}
            aria-describedby={`${id}-count${validation ? ` ${id}-validation` : ''}`}
            onChange={(event) => { setComment(event.target.value); setValidation(''); }} />
          <p className="tutor-flag-count" id={`${id}-count`}>{(isLocked ? state.comment : comment).length} / {TUTOR_FLAG_COMMENT_MAX_LENGTH} characters</p>
          {validation && <p role="alert" id={`${id}-validation`}>{validation}</p>}
        </>}
        {statusText(state) && <p role="status" aria-live="polite">{statusText(state)}</p>}
        {state?.status === 'pending' && <p>You can close this dialog while the report is sending.</p>}
        {state?.status === 'error' && <p role="alert">{state.text}</p>}
        <footer>
          <button type="button" onClick={onClose}>{isLocked ? 'Close' : 'Cancel'}</button>
          {state?.status !== 'success' && !state?.uncertain && <button type="submit" className="tutor-flag-submit" disabled={!!isLocked}>
            {state?.status === 'pending' ? 'Sending…' : state?.status === 'error' && !state.uncertain ? 'Retry report' : 'Submit report'}
          </button>}
        </footer>
      </form>
    </section>
  </div>, document.body);
}

export default function TutorFlag({ message, feedback }) {
  const triggerRef = useRef(null);
  const [opened, setOpened] = useState(null);
  const close = useCallback(() => setOpened(null), []);
  const key = message && tutorFlagKey(message);
  if (opened && (opened.scope !== feedback?.sessionScope || opened.key !== key)) setOpened(null);
  if (!feedback?.authenticated || !canFlagMessage(message)) return null;
  const ownState = feedback.flagEntries.get(key);
  const state = ownState?.status === 'success' ? ownState : feedback.flagPending || feedback.flagUncertainty || ownState;
  // Closing on either identity change prevents a draft or late result from
  // leaking into a different message or login when React reuses this component.
  const isOpen = opened?.scope === feedback.sessionScope && opened?.key === key;
  return <div className="tutor-flag">
    <button type="button" ref={triggerRef} aria-haspopup="dialog" onClick={() => setOpened({ scope: feedback.sessionScope, key })}>
      <Flag size={14} aria-hidden="true" /> {locked(state) ? 'View report status' : 'Flag incorrect answer'}
    </button>
    {!isOpen && statusText(state) && <span role="status" aria-live="polite">{statusText(state)}</span>}
    {!isOpen && state?.status === 'error' && <span role="alert">{state.text}</span>}
    {isOpen && <TutorFlagDialog message={message} feedback={feedback} state={state} initialComment={ownState?.comment || ''} triggerRef={triggerRef} onClose={close} />}
  </div>;
}
