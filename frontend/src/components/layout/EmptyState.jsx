import React, { useState } from 'react';
import { AlertCircle } from 'lucide-react';

/**
 * Compact empty state component for when there's no data.
 * Designed to fit inside cards, panels, and chart areas.
 *
 * @param {Object} props
 * @param {React.ReactNode} [props.icon] - Custom icon element or component (defaults to <AlertCircle />)
 * @param {string} [props.title] - Main title text (e.g. 'No data yet')
 * @param {string} [props.message] - Explanatory message text (e.g. 'Complete a quiz to see your analytics')
 * @param {{ label: string, onClick: Function }} [props.action] - Optional action button config
 * @param {boolean} [props.compact=false] - When true, renders a smaller single-row inline version
 * @param {React.CSSProperties} [props.style] - Custom container styles to merge
 */
export default function EmptyState({
  icon,
  title,
  message,
  action,
  compact = false,
  style = {},
}) {
  const [btnHovered, setBtnHovered] = useState(false);

  const iconSize = compact ? 20 : 32;

  let renderedIcon = null;
  if (icon === undefined) {
    renderedIcon = <AlertCircle size={iconSize} strokeWidth={1.75} style={{ flexShrink: 0 }} />;
  } else if (React.isValidElement(icon)) {
    renderedIcon = React.cloneElement(icon, {
      size: icon.props.size || iconSize,
      strokeWidth: icon.props.strokeWidth || 1.75,
      style: {
        flexShrink: 0,
        ...icon.props.style,
      },
    });
  } else if (typeof icon === 'function') {
    const IconComponent = icon;
    renderedIcon = <IconComponent size={iconSize} strokeWidth={1.75} style={{ flexShrink: 0 }} />;
  } else if (icon) {
    renderedIcon = icon;
  }

  if (compact) {
    return (
      <div
        style={{
          display: 'flex',
          flexDirection: 'row',
          alignItems: 'center',
          justifyContent: 'center',
          gap: '12px',
          padding: '16px 12px',
          width: '100%',
          boxSizing: 'border-box',
          ...style,
        }}
      >
        {renderedIcon && (
          <div
            style={{
              color: 'var(--text-tertiary, #6B7280)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              flexShrink: 0,
            }}
          >
            {renderedIcon}
          </div>
        )}

        {(title || message) && (
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              flexWrap: 'wrap',
              justifyContent: 'center',
            }}
          >
            {title && (
              <span
                style={{
                  fontSize: '13px',
                  fontWeight: 700,
                  color: 'var(--text-primary, #F3F4F6)',
                  lineHeight: 1.3,
                }}
              >
                {title}
              </span>
            )}
            {message && (
              <span
                style={{
                  fontSize: '13px',
                  color: 'var(--text-secondary, #9CA3AF)',
                  lineHeight: 1.3,
                }}
              >
                {message}
              </span>
            )}
          </div>
        )}

        {action?.label && (
          <button
            type="button"
            onClick={action.onClick}
            onMouseEnter={() => setBtnHovered(true)}
            onMouseLeave={() => setBtnHovered(false)}
            className="btn btn-primary"
            style={{
              backgroundColor: btnHovered ? '#4F46E5' : '#6366F1',
              background: btnHovered ? '#4F46E5' : '#6366F1',
              color: '#FFFFFF',
              padding: '6px 14px',
              borderRadius: '8px',
              fontSize: '13px',
              fontWeight: 600,
              border: '1px solid transparent',
              cursor: 'pointer',
              display: 'inline-flex',
              alignItems: 'center',
              justifyContent: 'center',
              transition: 'background-color 0.15s ease, box-shadow 0.15s ease',
              boxShadow: btnHovered ? '0 0 16px rgba(99, 102, 241, 0.35)' : 'none',
              flexShrink: 0,
            }}
          >
            {action.label}
          </button>
        )}
      </div>
    );
  }

  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        textAlign: 'center',
        padding: '48px 24px',
        width: '100%',
        boxSizing: 'border-box',
        ...style,
      }}
    >
      {renderedIcon && (
        <div
          style={{
            color: 'var(--text-tertiary, #6B7280)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            marginBottom: (title || message || action?.label) ? '16px' : 0,
          }}
        >
          {renderedIcon}
        </div>
      )}

      {title && (
        <h4
          style={{
            margin: 0,
            fontSize: '16px',
            fontWeight: 700,
            color: 'var(--text-primary, #F3F4F6)',
            lineHeight: 1.3,
            marginBottom: message ? '6px' : (action?.label ? '16px' : 0),
          }}
        >
          {title}
        </h4>
      )}

      {message && (
        <p
          style={{
            margin: 0,
            fontSize: '14px',
            color: 'var(--text-secondary, #9CA3AF)',
            maxWidth: '300px',
            textAlign: 'center',
            lineHeight: 1.5,
            marginBottom: action?.label ? '20px' : 0,
          }}
        >
          {message}
        </p>
      )}

      {action?.label && (
        <button
          type="button"
          onClick={action.onClick}
          onMouseEnter={() => setBtnHovered(true)}
          onMouseLeave={() => setBtnHovered(false)}
          className="btn btn-primary"
          style={{
            backgroundColor: btnHovered ? '#4F46E5' : '#6366F1',
            background: btnHovered ? '#4F46E5' : '#6366F1',
            color: '#FFFFFF',
            padding: '8px 16px',
            borderRadius: '8px',
            fontSize: '14px',
            fontWeight: 600,
            border: '1px solid transparent',
            cursor: 'pointer',
            display: 'inline-flex',
            alignItems: 'center',
            justifyContent: 'center',
            transition: 'background-color 0.15s ease, box-shadow 0.15s ease',
            boxShadow: btnHovered ? '0 0 16px rgba(99, 102, 241, 0.35)' : 'none',
          }}
        >
          {action.label}
        </button>
      )}
    </div>
  );
}
