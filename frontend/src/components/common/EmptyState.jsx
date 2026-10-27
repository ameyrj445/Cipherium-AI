import React from 'react';

/**
 * Compact, helpful empty state (icon, 1-2 lines of text, one action).
 * Replaces blank boxes and empty chart placeholders across the dashboard.
 */
export default function EmptyState({
  icon: Icon,
  title,
  description = '',
  actionLabel = '',
  onAction = null,
  compact = false,
  style = {},
}) {
  return (
    <div
      style={{
        padding: compact ? '20px 16px' : '28px 20px',
        borderRadius: '12px',
        border: '1px solid var(--border-stroke, #2D2D35)',
        background: 'var(--bg-shell, #161618)',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        textAlign: 'center',
        gap: '10px',
        ...style,
      }}
    >
      {Icon && (
        <div
          style={{
            width: '38px',
            height: '38px',
            borderRadius: '10px',
            background: 'var(--bg-surface, #1E1E22)',
            border: '1px solid var(--border-stroke, #2D2D35)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: 'var(--text-secondary, #9CA3AF)',
          }}
        >
          <Icon size={18} />
        </div>
      )}

      <div>
        <div
          style={{
            fontSize: '0.88rem',
            fontWeight: 700,
            color: 'var(--text-primary, #F3F4F6)',
            marginBottom: description ? '4px' : '0',
          }}
        >
          {title}
        </div>
        {description && (
          <p
            style={{
              fontSize: '0.78rem',
              color: 'var(--text-secondary, #9CA3AF)',
              margin: 0,
              maxWidth: '300px',
              lineHeight: 1.45,
            }}
          >
            {description}
          </p>
        )}
      </div>

      {actionLabel && onAction && (
        <button
          type="button"
          onClick={onAction}
          className="btn btn-primary"
          style={{
            fontSize: '0.78rem',
            padding: '6px 14px',
            borderRadius: '8px',
            marginTop: '4px',
          }}
        >
          {actionLabel}
        </button>
      )}
    </div>
  );
}
