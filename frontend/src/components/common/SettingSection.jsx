import React from 'react';

/**
 * Reusable layout container for settings categories.
 * Ensures consistent padding, typography, icon presentation, and spacing.
 */
export default function SettingSection({
  icon: Icon,
  title,
  description,
  badge = null,
  children,
}) {
  return (
    <div
      className="ui-card"
      style={{
        padding: '24px',
        borderRadius: '14px',
        background: 'var(--bg-surface, #1E1E22)',
        border: '1px solid var(--border-stroke, #2D2D35)',
        marginBottom: '20px',
        textAlign: 'left',
      }}
    >
      {/* Section Header */}
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'flex-start',
          marginBottom: '20px',
          gap: '12px',
          flexWrap: 'wrap',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          {Icon && (
            <div
              style={{
                width: '36px',
                height: '36px',
                borderRadius: '8px',
                background: 'rgba(99, 102, 241, 0.12)',
                border: '1px solid rgba(99, 102, 241, 0.25)',
                color: '#818cf8',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                flexShrink: 0,
              }}
            >
              <Icon size={18} />
            </div>
          )}
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <h3 style={{ margin: 0, fontSize: '1.05rem', fontWeight: 700, color: 'var(--text-primary, #F3F4F6)' }}>
                {title}
              </h3>
              {badge && (
                <span
                  style={{
                    fontSize: '0.68rem',
                    fontWeight: 700,
                    padding: '2px 8px',
                    borderRadius: '6px',
                    background: 'rgba(99, 102, 241, 0.15)',
                    color: '#a5b4fc',
                    border: '1px solid rgba(99, 102, 241, 0.25)',
                  }}
                >
                  {badge}
                </span>
              )}
            </div>
            {description && (
              <p style={{ margin: '3px 0 0', fontSize: '0.8rem', color: 'var(--text-secondary, #9CA3AF)', lineHeight: 1.45 }}>
                {description}
              </p>
            )}
          </div>
        </div>
      </div>

      {/* Section Content */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
        {children}
      </div>
    </div>
  );
}
