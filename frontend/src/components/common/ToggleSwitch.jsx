import React from 'react';

/**
 * Accessible, production-ready toggle switch component with dark-mode styling.
 */
export default function ToggleSwitch({
  id,
  checked = false,
  onChange = () => {},
  label,
  description = null,
  disabled = false,
}) {
  return (
    <div
      style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        gap: '16px',
        padding: '12px 14px',
        borderRadius: '10px',
        background: 'var(--bg-shell, #161618)',
        border: '1px solid var(--border-stroke, #2D2D35)',
        opacity: disabled ? 0.6 : 1,
        transition: 'border-color 0.15s ease',
      }}
    >
      <div style={{ flex: 1 }}>
        <label
          htmlFor={id}
          style={{
            fontSize: '0.86rem',
            fontWeight: 600,
            color: 'var(--text-primary, #F3F4F6)',
            cursor: disabled ? 'not-allowed' : 'pointer',
            display: 'block',
          }}
        >
          {label}
        </label>
        {description && (
          <p style={{ margin: '2px 0 0', fontSize: '0.74rem', color: 'var(--text-secondary, #9CA3AF)', lineHeight: 1.4 }}>
            {description}
          </p>
        )}
      </div>

      <button
        type="button"
        role="switch"
        id={id}
        aria-checked={checked}
        disabled={disabled}
        onClick={() => !disabled && onChange(!checked)}
        style={{
          width: '42px',
          height: '24px',
          borderRadius: '12px',
          background: checked ? '#6366f1' : 'var(--border-stroke, #2D2D35)',
          border: `1px solid ${checked ? '#4f46e5' : '#334155'}`,
          padding: '2px',
          display: 'flex',
          alignItems: 'center',
          cursor: disabled ? 'not-allowed' : 'pointer',
          transition: 'background-color 0.2s ease, border-color 0.2s ease',
          flexShrink: 0,
        }}
      >
        <span
          style={{
            width: '18px',
            height: '18px',
            borderRadius: '50%',
            background: '#ffffff',
            transform: checked ? 'translateX(18px)' : 'translateX(0)',
            transition: 'transform 0.2s ease',
            boxShadow: '0 1px 3px rgba(0, 0, 0, 0.3)',
          }}
        />
      </button>
    </div>
  );
}
