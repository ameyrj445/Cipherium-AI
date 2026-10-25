import React from 'react';
import { ArrowRight, Compass, Sparkles } from 'lucide-react';

/**
 * Slim primary action card for Row 1 of the dashboard.
 * Switches between an active roadmap status with a single "Continue Learning" CTA
 * and an onboarding "Create your first study plan" state when no plan exists.
 */
export default function HeroBanner({
  customPlan = null,
  onContinueLearning,
  onViewStudyPlan,
}) {
  const hasPlan = Boolean(customPlan);
  const activeSubject = customPlan?.subject;

  return (
    <div
      className="ui-card"
      style={{
        padding: '20px 24px',
        marginBottom: '24px',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        gap: '16px',
        flexWrap: 'wrap',
        background: 'var(--bg-surface, #1E1E22)',
        border: '1px solid var(--border-stroke, #2D2D35)',
        borderRadius: '12px',
      }}
    >
      <div style={{ maxWidth: '620px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
          <span
            style={{
              fontSize: '0.72rem',
              fontWeight: 700,
              letterSpacing: '0.04em',
              textTransform: 'uppercase',
              color: '#818CF8',
              background: 'rgba(99, 102, 241, 0.12)',
              border: '1px solid rgba(99, 102, 241, 0.25)',
              padding: '2px 8px',
              borderRadius: '5px',
              display: 'inline-flex',
              alignItems: 'center',
              gap: '4px',
            }}
          >
            {hasPlan ? <Compass size={12} /> : <Sparkles size={12} />}
            {hasPlan ? 'Active Roadmap' : 'Get Started'}
          </span>
        </div>

        <h2
          style={{
            fontSize: '1.25rem',
            fontWeight: 700,
            color: 'var(--text-primary, #F3F4F6)',
            margin: '0 0 4px',
            lineHeight: 1.3,
            letterSpacing: '-0.01em',
          }}
        >
          {hasPlan ? activeSubject : 'Create your first study plan'}
        </h2>
        <p
          style={{
            fontSize: '0.84rem',
            color: 'var(--text-secondary, #9CA3AF)',
            margin: 0,
            lineHeight: 1.45,
          }}
        >
          {hasPlan
            ? 'Pick up where you left off in your structured curriculum roadmap.'
            : 'Set up an adaptive learning roadmap tailored to your schedule and goals.'}
        </p>
      </div>

      <div>
        {hasPlan ? (
          <button
            type="button"
            onClick={onContinueLearning}
            className="btn btn-primary"
            style={{
              padding: '10px 20px',
              fontSize: '0.86rem',
              fontWeight: 600,
              display: 'inline-flex',
              alignItems: 'center',
              gap: '8px',
              borderRadius: '8px',
            }}
          >
            Continue Learning <ArrowRight size={15} />
          </button>
        ) : (
          <button
            type="button"
            onClick={onViewStudyPlan || onContinueLearning}
            className="btn btn-primary"
            style={{
              padding: '10px 20px',
              fontSize: '0.86rem',
              fontWeight: 600,
              display: 'inline-flex',
              alignItems: 'center',
              gap: '8px',
              borderRadius: '8px',
            }}
          >
            Create Study Plan <ArrowRight size={15} />
          </button>
        )}
      </div>
    </div>
  );
}
