import React from 'react';

/**
 * Standardized section header adhering to the 16-18px semibold type scale
 * with an optional subtle text action link on the right.
 */
export default function SectionHeader({
  title,
  subtitle = '',
  actionLabel = '',
  onAction = null,
  style = {},
}) {
  return (
    <div
      style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: subtitle ? 'flex-start' : 'center',
        marginBottom: '14px',
        gap: '12px',
        ...style,
      }}
    >
      <div>
        <h3
          style={{
            fontSize: '1.05rem',
            fontWeight: 700,
            color: 'var(--text-primary, #F3F4F6)',
            margin: 0,
            lineHeight: 1.3,
            letterSpacing: '-0.01em',
          }}
        >
          {title}
        </h3>
        {subtitle && (
          <p
            style={{
              fontSize: '0.8rem',
              color: 'var(--text-secondary, #9CA3AF)',
              margin: '3px 0 0',
              lineHeight: 1.4,
            }}
          >
            {subtitle}
          </p>
        )}
      </div>

      {actionLabel && onAction && (
        <button
          type="button"
          onClick={onAction}
          style={{
            background: 'transparent',
            border: 'none',
            color: 'var(--text-secondary, #9CA3AF)',
            fontSize: '0.8rem',
            fontWeight: 600,
            cursor: 'pointer',
            padding: '2px 0',
            display: 'inline-flex',
            alignItems: 'center',
            gap: '4px',
            whiteSpace: 'nowrap',
            transition: 'color 0.15s ease',
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.color = '#818CF8';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.color = 'var(--text-secondary, #9CA3AF)';
          }}
        >
          {actionLabel}
        </button>
      )}
    </div>
  );
}
