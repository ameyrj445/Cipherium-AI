import React from 'react';
import { BarChart2 } from 'lucide-react';
import SectionHeader from './common/SectionHeader';
import EmptyState from './common/EmptyState';

/**
 * Row 4 Left (8 cols equivalent): Analytics panel.
 * Features a single cohesive performance visualization with Week/Month/Year period toggle.
 * Redundant mini-metric boxes have been eliminated. Collapses into a compact, helpful
 * empty state when no study activity has been recorded.
 */
export default function AnalyticsPanel({
  analyticsPeriod = 'Week',
  setAnalyticsPeriod,
  dashboardData,
  onStartPractice,
}) {
  const data = dashboardData || { completion: 0, topicsData: [] };
  const topicsData = data.topicsData || [];
  const hasData = topicsData.length > 0 || data.completion > 0;

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px', flexWrap: 'wrap', gap: '10px' }}>
        <SectionHeader
          title="Performance Analytics"
          subtitle="Curriculum mastery and diagnostic progress"
          style={{ marginBottom: 0 }}
        />

        {/* Period Segment Control */}
        <div
          style={{
            display: 'flex',
            background: 'var(--bg-shell, #161618)',
            borderRadius: '8px',
            padding: '3px',
            border: '1px solid var(--border-stroke, #2D2D35)',
          }}
        >
          {['Week', 'Month', 'Year'].map((p) => (
            <button
              key={p}
              type="button"
              onClick={() => setAnalyticsPeriod && setAnalyticsPeriod(p)}
              style={{
                padding: '5px 10px',
                border: analyticsPeriod === p ? '1px solid rgba(255, 255, 255, 0.12)' : '1px solid transparent',
                borderRadius: '6px',
                background: analyticsPeriod === p ? 'var(--bg-hover, #2A2A30)' : 'transparent',
                color: analyticsPeriod === p ? 'var(--text-primary, #F3F4F6)' : 'var(--text-secondary, #9CA3AF)',
                fontSize: '0.76rem',
                fontWeight: 600,
                cursor: 'pointer',
                transition: 'all 0.15s ease',
              }}
            >
              {p}
            </button>
          ))}
        </div>
      </div>

      <div
        className="ui-card"
        style={{
          padding: '24px',
          background: 'var(--bg-surface, #1E1E22)',
          border: '1px solid var(--border-stroke, #2D2D35)',
          minHeight: '220px',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: hasData ? 'flex-start' : 'center',
        }}
      >
        {hasData ? (
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
              <span style={{ fontSize: '0.84rem', fontWeight: 700, color: 'var(--text-primary, #F3F4F6)' }}>
                Topic-wise Mastery Breakdown
              </span>
              <span style={{ fontSize: '0.78rem', color: 'var(--text-secondary, #9CA3AF)' }}>
                {topicsData.length} trackable stages
              </span>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
              {topicsData.slice(0, 5).map((t, idx) => (
                <div key={t.topic || idx}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.8rem', marginBottom: '6px' }}>
                    <span style={{ fontWeight: 600, color: 'var(--text-primary, #F3F4F6)' }}>{t.topic}</span>
                    <span style={{ fontWeight: 700, color: t.color || '#6366F1' }}>{t.pct}%</span>
                  </div>
                  <div style={{ height: '7px', background: 'var(--bg-shell, #161618)', borderRadius: '4px', overflow: 'hidden', border: '1px solid var(--border-stroke, #2D2D35)' }}>
                    <div
                      style={{
                        width: `${Math.max(t.pct, 3)}%`,
                        height: '100%',
                        background: t.color || '#6366F1',
                        borderRadius: '4px',
                        transition: 'width 0.3s ease',
                      }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>
        ) : (
          <EmptyState
            compact
            icon={BarChart2}
            title="No study analytics recorded yet"
            description="Complete diagnostic quizzes or progress through curriculum milestones to see your mastery metrics."
            actionLabel={onStartPractice ? "Start diagnostic practice" : ""}
            onAction={onStartPractice}
          />
        )}
      </div>
    </div>
  );
}
