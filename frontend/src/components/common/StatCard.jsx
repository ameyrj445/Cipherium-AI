import React from 'react';

/**
 * Clean, structured individual metric card for the 4-item stats strip.
 * Respects 12px minimum typography and avoids nested borders.
 */
export default function StatCard({
  icon: Icon,
  label,
  value,
  sublabel = '',
  accentColor = '#6366F1',
  onClick = null,
}) {
  return (
    <div
      className="ui-card"
      onClick={onClick}
      style={{
        padding: '20px',
        display: 'flex',
        alignItems: 'center',
        gap: '14px',
        cursor: onClick ? 'pointer' : 'default',
        transition: 'transform 0.15s ease, border-color 0.15s ease',
      }}
    >
      {Icon && (
        <div
          style={{
            width: '42px',
            height: '42px',
            borderRadius: '10px',
            background: `${accentColor}18`,
            border: `1px solid ${accentColor}35`,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            flexShrink: 0,
          }}
        >
          <Icon size={20} color={accentColor} />
        </div>
      )}

      <div style={{ overflow: 'hidden' }}>
        <div
          style={{
            fontSize: '1.45rem',
            fontWeight: 800,
            color: 'var(--text-primary, #F3F4F6)',
            lineHeight: 1.2,
            letterSpacing: '-0.02em',
          }}
        >
          {value}
        </div>
        <div
          style={{
            fontSize: '0.78rem',
            fontWeight: 600,
            color: 'var(--text-secondary, #9CA3AF)',
            marginTop: '2px',
            whiteSpace: 'nowrap',
            overflow: 'hidden',
            textOverflow: 'ellipsis',
          }}
        >
          {label}
        </div>
        {sublabel && (
          <div
            style={{
              fontSize: '0.75rem',
              color: 'var(--text-tertiary, #6B7280)',
              marginTop: '1px',
              whiteSpace: 'nowrap',
              overflow: 'hidden',
              textOverflow: 'ellipsis',
            }}
          >
            {sublabel}
          </div>
        )}
      </div>
    </div>
  );
}
