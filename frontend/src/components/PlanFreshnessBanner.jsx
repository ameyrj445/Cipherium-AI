import React, { useId } from 'react';
import { planFreshnessFromFixture } from '../utils/planFreshness';
import './PlanFreshnessBanner.css';

const COPY = {
  unavailable: ['Plan freshness unavailable', 'We cannot verify whether this study plan reflects your latest mastery.'],
  checking: ['Checking plan freshness…', 'Waiting for a freshness assessment for this plan.'],
  fresh: ['Study plan is up to date', 'The latest assessment found no refresh needed for this plan.'],
  stale: ['Your study plan may be out of date', 'Your mastery has changed since this plan was generated.'],
  regenerating: ['Regenerating study plan…', 'Waiting for confirmation that this plan was refreshed.'],
  error: ['Plan refresh could not be confirmed', 'The outcome is unknown. Check this plan before trying again.'],
  refreshed: ['Study plan refreshed', 'A refresh was confirmed for this plan.'],
};

// No action callback or API is intentionally exposed. The fixture prop supports
// isolated tests only, and is rejected in every non-test build by the adapter.
export default function PlanFreshnessBanner({ planId, fixture }) {
  const id = useId();
  const state = planFreshnessFromFixture(fixture, planId);
  const [title, description] = COPY[state.status];
  const pending = state.status === 'checking' || state.status === 'regenerating';
  const preview = state.status !== 'unavailable';
  return (
    <section className={`plan-freshness plan-freshness--${state.status}`} aria-labelledby={`${id}-title`}>
      <div className="plan-freshness__copy">
        <div role={state.status === 'error' ? 'alert' : 'status'} aria-atomic="true">
          <h2 id={`${id}-title`}>{title}</h2>
          <p>{description}</p>
        </div>
        {state.generatedAt !== null && state.generatedAt !== undefined && <p>
          Last generated: <time dateTime={new Date(state.generatedAt).toISOString()}>
            {new Date(state.generatedAt).toISOString().replace('T', ' ').replace('.000Z', ' UTC')}
          </time>
        </p>}
        <p id={`${id}-reason`}>
          {preview ? 'State preview only. ' : ''}Regeneration is unavailable until the server can safely identify and update this plan.
        </p>
      </div>
      <button type="button" className="btn btn-white plan-freshness__action" disabled
        aria-describedby={`${id}-reason`} aria-busy={pending}>
        {state.status === 'regenerating' ? 'Regenerating…' : 'Regenerate plan'}
      </button>
    </section>
  );
}
