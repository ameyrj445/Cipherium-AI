import React from 'react';
import { AlertTriangle, Clock, ArrowRight, Sparkles } from 'lucide-react';

/**
 * Production-ready remediation card for diagnosed weak topics.
 * Translates ML risk predictions into clear, actionable practice triage.
 */
export default function FlashFixCard({
  topicName,
  diagnosis = 'Diagnosed gap based on recent quiz answers and practice velocity.',
  estimatedTime = '15 mins',
  riskScore = null,
  status = 'Intervention Recommended',
  onPractice = () => {},
}) {
  return (
    <div
      className="ui-card"
      style={{
        padding: '18px 20px',
        borderRadius: '14px',
        border: '1px solid var(--border-stroke, #2D2D35)',
        background: 'var(--bg-surface, #1E1E22)',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'space-between',
        textAlign: 'left',
        gap: '14px',
        transition: 'border-color 0.2s ease, transform 0.2s ease',
      }}
    >
      <div>
        {/* Top Status & Estimate Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px', gap: '8px', flexWrap: 'wrap' }}>
          <span
            style={{
              fontSize: '0.68rem',
              fontWeight: 700,
              padding: '3px 8px',
              borderRadius: '6px',
              background: 'rgba(239, 68, 68, 0.15)',
              color: '#EF4444',
              border: '1px solid rgba(239, 68, 68, 0.3)',
              display: 'inline-flex',
              alignItems: 'center',
              gap: '4px',
            }}
          >
            <AlertTriangle size={11} />
            {status}
          </span>

          <div style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: '0.72rem', color: 'var(--text-secondary, #9CA3AF)' }}>
            <Clock size={12} />
            <span>~{estimatedTime} fix</span>
          </div>
        </div>

        {/* Topic Title */}
        <h4 style={{ margin: '0 0 6px', fontSize: '0.98rem', fontWeight: 700, color: 'var(--text-primary, #F3F4F6)' }}>
          {topicName}
        </h4>

        {/* Plain English Diagnosis */}
        <p style={{ margin: 0, fontSize: '0.78rem', color: 'var(--text-secondary, #9CA3AF)', lineHeight: 1.45 }}>
          {diagnosis}
        </p>

        {riskScore !== null && (
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginTop: '10px', fontSize: '0.72rem', color: 'var(--text-tertiary, #6B7280)' }}>
            <Sparkles size={11} color="#EF4444" />
            <span>Diagnostic Risk Probability: <strong style={{ color: '#EF4444' }}>{riskScore}%</strong></span>
          </div>
        )}
      </div>

      {/* Action Footer */}
      <div style={{ paddingTop: '10px', borderTop: '1px solid var(--border-stroke, #2D2D35)' }}>
        <button
          type="button"
          aria-label="Start Flash Fix"
          onClick={() => onPractice(topicName)}
          className="btn btn-primary"
          style={{
            width: '100%',
            padding: '8px 14px',
            borderRadius: '8px',
            fontSize: '0.76rem',
            fontWeight: 700,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '6px',
            cursor: 'pointer',
          }}
        >
          <span>Practice</span>
          <ArrowRight size={13} />
        </button>
      </div>
    </div>
  );
}
