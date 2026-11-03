import React from 'react';
import { ThumbsUp, ThumbsDown } from 'lucide-react';
import { canRateMessage } from '../hooks/useTutorFeedback';
import TutorFlag from './TutorFlag';

export default function TutorFeedback({ message, feedback }) {
  if (message.role !== 'assistant' || message.isCustomCard || message.error) return null;
  if (!canRateMessage(message)) return <><small style={{ color: 'var(--text-secondary)' }}>
    {message.streaming ? 'Rating is unavailable while this answer is streaming.'
      : 'Rating unavailable: this answer has no saved message ID. Only saved answers loaded from history can be rated.'}
  </small><TutorFlag message={message} feedback={feedback} /></>;
  if (!feedback) return null;
  const state = feedback.entries.get(message.id);
  const locked = state?.status === 'pending' || state?.status === 'success' || state?.uncertain;
  return <div role="group" aria-label="Rate tutor answer" style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: 8, fontSize: '0.8rem' }}>
    <span>Was this helpful?</span>
    <button type="button" aria-label="Helpful" aria-pressed={state?.rating === 1} disabled={!!locked} onClick={() => feedback.submit(message, 1)}><ThumbsUp size={14} /> Helpful</button>
    <button type="button" aria-label="Not helpful" aria-pressed={state?.rating === -1} disabled={!!locked} onClick={() => feedback.submit(message, -1)}><ThumbsDown size={14} /> Not helpful</button>
    <span role="status" aria-live="polite">{state?.status === 'pending' ? 'Checking and saving rating…' : state?.status === 'success' ? 'Rating saved. Thank you!' : ''}</span>
    {state?.status === 'error' && <><span role="alert">{state.text}</span><button type="button" onClick={() => feedback.submit(message, state.rating)}>{state.uncertain ? 'Check rating status' : 'Retry rating'}</button></>}
    <TutorFlag message={message} feedback={feedback} />
  </div>;
}
