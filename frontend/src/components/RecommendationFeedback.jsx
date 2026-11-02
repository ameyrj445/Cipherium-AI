import React from 'react';
import { canRateRecommendation, RECOMMENDATION_CHOICES } from '../hooks/useRecommendationFeedback';
import './RecommendationFeedback.css';

export default function RecommendationFeedback({ targetId, title, feedback }) {
  if (!feedback?.authenticated || !canRateRecommendation(targetId)) return null;
  const state = feedback.entries.get(targetId);
  const locked = state?.status === 'pending' || state?.status === 'success' || state?.uncertain;
  return <div className="recommendation-feedback" role="group" aria-label={`Feedback for ${title || 'recommended resource'}`}>
    <p className="recommendation-feedback-title">How was this recommendation?</p>
    <p className="recommendation-feedback-hint">Too easy or Too hard adjusts your overall learning difficulty. Choose one response per resource.</p>
    <div className="recommendation-feedback-options">
      {Object.entries(RECOMMENDATION_CHOICES).map(([choice, option]) => <button
        key={choice} type="button" disabled={!!locked} aria-pressed={state?.choice === choice}
        onClick={() => feedback.submit(targetId, choice)}>{option.label}</button>)}
    </div>
    <span role="status" aria-live="polite">{state?.status === 'pending' ? 'Checking and saving feedback…' : state?.status === 'success' ? (state.previouslySaved ? 'You previously rated this resource. No new feedback was sent.' : 'Feedback saved. Thank you!') : ''}</span>
    {state?.status === 'error' && <>
      <span role="alert">{state.text}</span>
      <button type="button" onClick={() => feedback.submit(targetId, state.choice)}>{state.uncertain ? 'Check feedback status' : 'Retry feedback'}</button>
    </>}
  </div>;
}
