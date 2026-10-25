import React from 'react';
import { Compass, Sparkles, CheckCircle2, Clock, ChevronRight, Zap, Brain, Layers } from 'lucide-react';

export const CURATED_BLUEPRINTS = [
  {
    id: 'DSA',
    title: 'Software Engineering & Algorithms',
    icon: Zap,
    tagline: 'Master data structures, graph traversals, and dynamic programming patterns.',
    checkpoints: 32,
    durationWeeks: 8,
    hoursPerWeek: 6,
    category: 'DSA',
    tags: ['LeetCode 75', 'NeetCode 150', 'Striver A2Z'],
    accentColor: '#7C3AED',
    borderColor: 'rgba(124, 58, 237, 0.4)',
    bgGlow: 'rgba(59, 33, 100, 0.25)',
  },
  {
    id: 'ML',
    title: 'Machine Learning & AI Engineering',
    icon: Brain,
    tagline: 'Grounded math, deep neural architectures, PyTorch, and predictive modeling.',
    checkpoints: 28,
    durationWeeks: 10,
    hoursPerWeek: 8,
    category: 'ML',
    tags: ['Math Foundations', 'PyTorch Core', 'OULAD Analytics'],
    accentColor: '#6366F1',
    borderColor: 'rgba(99, 102, 241, 0.4)',
    bgGlow: 'rgba(40, 30, 90, 0.25)',
  },
  {
    id: 'System Design',
    title: 'Full-Stack & System Architecture',
    icon: Layers,
    tagline: 'High-throughput APIs, distributed caching, database indexing, and Docker.',
    checkpoints: 24,
    durationWeeks: 6,
    hoursPerWeek: 5,
    category: 'Systems',
    tags: ['FastAPI & React', 'Redis Caching', 'PostgreSQL Scale'],
    accentColor: '#10B981',
    borderColor: 'rgba(16, 185, 129, 0.4)',
    bgGlow: 'rgba(16, 60, 45, 0.25)',
  },
];

/**
 * High-engagement onboarding component when no study plan is active.
 * Supports bare mode where cards sit directly on page canvas in a 3-4 column auto-fill grid.
 */
export default function BlueprintWizard({
  onSelectBlueprint = () => {},
  onOpenCustomGenerator = () => {},
  bare = false,
  showCustomCta = true,
  categoryFilter = 'All',
  durationFilter = 'All',
  hoursFilter = 'All',
}) {
  const filteredBlueprints = CURATED_BLUEPRINTS.filter((bp) => {
    if (categoryFilter !== 'All' && bp.category !== categoryFilter) return false;
    if (durationFilter === '<8' && bp.durationWeeks >= 8) return false;
    if (durationFilter === '>=8' && bp.durationWeeks < 8) return false;
    if (hoursFilter === '<6' && bp.hoursPerWeek >= 6) return false;
    if (hoursFilter === '>=6' && bp.hoursPerWeek < 6) return false;
    return true;
  });

  const cardsToRender = filteredBlueprints.length > 0 ? filteredBlueprints : CURATED_BLUEPRINTS;

  const content = (
    <>
      {!bare && (
        <>
          {/* Header Badge */}
          <div
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '8px',
              padding: '6px 14px',
              borderRadius: '20px',
              background: 'rgba(99, 102, 241, 0.12)',
              border: '1px solid rgba(99, 102, 241, 0.25)',
              color: '#818CF8',
              fontSize: '0.78rem',
              fontWeight: 700,
              marginBottom: '14px',
            }}
          >
            <Compass size={14} />
            <span>CHOOSE YOUR TARGET BLUEPRINT</span>
          </div>

          <h3
            style={{
              fontSize: '1.45rem',
              fontWeight: 800,
              color: 'var(--text-primary, #F3F4F6)',
              margin: '0 0 8px',
              letterSpacing: '-0.02em',
            }}
          >
            Select a Proven Curriculum Track
          </h3>
          <p
            style={{
              color: 'var(--text-secondary, #9CA3AF)',
              fontSize: '0.88rem',
              maxWidth: '560px',
              margin: '0 auto 28px',
              lineHeight: 1.5,
            }}
          >
            Get started immediately with an industry-tested roadmap or let our AI engine synthesize a personalized plan matched to your target role.
          </p>
        </>
      )}

      {/* 3 Blueprint Cards Grid: repeat(auto-fill, minmax(340px, 1fr)) */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fill, minmax(340px, 1fr))',
          gap: '24px',
          textAlign: 'left',
          marginBottom: showCustomCta ? '28px' : 0,
          width: '100%',
          boxSizing: 'border-box',
        }}
      >
        {cardsToRender.map((bp) => {
          const Icon = bp.icon;
          return (
            <div
              key={bp.id}
              className="ui-card"
              style={{
                padding: '24px',
                borderRadius: '14px',
                border: `1px solid ${bp.borderColor}`,
                background: 'var(--bg-surface, #1E1E22)',
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'space-between',
                transition: 'border-color 0.2s ease, transform 0.2s ease',
                height: '100%',
                boxSizing: 'border-box',
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.transform = 'translateY(-2px)';
                e.currentTarget.style.borderColor = bp.accentColor;
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.transform = 'translateY(0)';
                e.currentTarget.style.borderColor = bp.borderColor;
              }}
            >
              <div>
                <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    marginBottom: '14px',
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <div
                      style={{
                        width: '36px',
                        height: '36px',
                        borderRadius: '10px',
                        background: 'rgba(255, 255, 255, 0.05)',
                        border: '1px solid rgba(255, 255, 255, 0.1)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        color: bp.accentColor,
                      }}
                    >
                      <Icon size={18} />
                    </div>
                    <span
                      style={{
                        fontSize: '0.72rem',
                        fontWeight: 700,
                        color: bp.accentColor,
                        textTransform: 'uppercase',
                        letterSpacing: '0.04em',
                      }}
                    >
                      Curated Track
                    </span>
                  </div>
                  <span
                    style={{
                      fontSize: '0.7rem',
                      fontWeight: 600,
                      color: 'var(--text-secondary, #9CA3AF)',
                      background: 'var(--bg-shell, #161618)',
                      padding: '2px 8px',
                      borderRadius: '6px',
                      border: '1px solid var(--border-stroke, #2D2D35)',
                    }}
                  >
                    {bp.category}
                  </span>
                </div>

                <h4
                  style={{
                    fontSize: '1.12rem',
                    fontWeight: 800,
                    color: 'var(--text-primary, #F3F4F6)',
                    margin: '0 0 8px',
                    lineHeight: 1.3,
                  }}
                >
                  {bp.title}
                </h4>
                <p
                  style={{
                    fontSize: '0.82rem',
                    color: 'var(--text-secondary, #9CA3AF)',
                    lineHeight: 1.5,
                    margin: '0 0 16px',
                  }}
                >
                  {bp.tagline}
                </p>

                {/* Metrics Pill Row */}
                <div
                  style={{
                    display: 'flex',
                    flexWrap: 'wrap',
                    gap: '8px',
                    marginBottom: '16px',
                  }}
                >
                  <div
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '4px',
                      fontSize: '0.74rem',
                      color: 'var(--text-primary, #F3F4F6)',
                      background: 'rgba(255, 255, 255, 0.04)',
                      padding: '4px 8px',
                      borderRadius: '6px',
                      border: '1px solid rgba(255, 255, 255, 0.06)',
                    }}
                  >
                    <CheckCircle2 size={13} color="#10B981" />
                    <span>{bp.checkpoints} Checkpoints</span>
                  </div>
                  <div
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '4px',
                      fontSize: '0.74rem',
                      color: 'var(--text-primary, #F3F4F6)',
                      background: 'rgba(255, 255, 255, 0.04)',
                      padding: '4px 8px',
                      borderRadius: '6px',
                      border: '1px solid rgba(255, 255, 255, 0.06)',
                    }}
                  >
                    <Clock size={13} color="#818CF8" />
                    <span>{bp.durationWeeks} Wks · {bp.hoursPerWeek}h/wk</span>
                  </div>
                </div>

                {/* Tags */}
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px', marginBottom: '24px' }}>
                  {bp.tags.map((tag) => (
                    <span
                      key={tag}
                      style={{
                        fontSize: '0.7rem',
                        fontWeight: 600,
                        color: 'var(--text-secondary, #9CA3AF)',
                        background: 'var(--bg-shell, #161618)',
                        padding: '3px 8px',
                        borderRadius: '4px',
                        border: '1px solid var(--border-stroke, #2D2D35)',
                      }}
                    >
                      {tag}
                    </span>
                  ))}
                </div>
              </div>

              {/* Start Button Pinned to Card Bottom */}
              <button
                type="button"
                onClick={() => onSelectBlueprint(bp.id)}
                className="btn btn-primary"
                style={{
                  width: '100%',
                  padding: '10px 16px',
                  borderRadius: '10px',
                  fontSize: '0.84rem',
                  fontWeight: 700,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '6px',
                  cursor: 'pointer',
                  marginTop: 'auto',
                }}
              >
                <span>Start This Blueprint</span>
                <ChevronRight size={14} />
              </button>
            </div>
          );
        })}
      </div>

      {/* Bottom Custom Generator Trigger */}
      {showCustomCta && (
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '12px',
            padding: '14px 20px',
            borderRadius: '12px',
            background: 'var(--bg-surface, #1E1E22)',
            border: '1px solid var(--border-stroke, #2D2D35)',
            width: '100%',
            maxWidth: '680px',
            margin: '0 auto',
            flexWrap: 'wrap',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--text-secondary, #9CA3AF)', fontSize: '0.84rem' }}>
            <Sparkles size={16} color="#818CF8" />
            <span>Have a specific interview or target tech stack in mind?</span>
          </div>
          <button
            type="button"
            onClick={onOpenCustomGenerator}
            className="btn btn-white"
            style={{
              fontSize: '0.78rem',
              fontWeight: 700,
              padding: '7px 14px',
              borderRadius: '8px',
              cursor: 'pointer',
            }}
          >
            Generate Custom AI Plan
          </button>
        </div>
      )}
    </>
  );

  if (bare) {
    return <div style={{ width: '100%' }}>{content}</div>;
  }

  return (
    <div
      style={{
        padding: '32px 24px',
        borderRadius: '16px',
        background: 'var(--bg-surface, #1E1E22)',
        border: '1px solid var(--border-stroke, #2D2D35)',
        textAlign: 'center',
        marginBottom: '28px',
      }}
    >
      {content}
    </div>
  );
}
