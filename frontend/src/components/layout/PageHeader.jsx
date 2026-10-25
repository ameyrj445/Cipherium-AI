import React from 'react';
import designTokens, { typography, colors, spacing } from '../../theme/designTokens.js';

/**
 * PageHeader
 * Reusable page section header component adhering to Cipherium design tokens.
 *
 * Props:
 * - eyebrow (string, optional) — small uppercase text above title (e.g. 'CURATED LEARNING REPOSITORY')
 * - title (string, required) — main heading
 * - description (string, optional) — one-line subtitle below title
 * - actions (ReactNode, optional) — right-aligned content (buttons, segmented controls)
 * - style (object, optional) — additional styles
 * - className (string, optional) — additional CSS class name
 */
export default function PageHeader({
  eyebrow,
  title,
  description,
  actions,
  style = {},
  className = '',
  ...rest
}) {
  return (
    <div
      className={className || undefined}
      style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'flex-start',
        flexWrap: 'wrap',
        gap: `${spacing?.space16 ?? 16}px`,
        marginBottom: `${spacing?.space24 ?? 24}px`,
        ...style,
      }}
      {...rest}
    >
      <div>
        {eyebrow && (
          <span
            style={{
              display: 'inline-block',
              fontSize: `${typography?.caption ?? 12}px`,
              fontWeight: 800,
              color: colors?.primaryBrand || '#6366F1',
              letterSpacing: '.06em',
              textTransform: 'uppercase',
              marginBottom: `${spacing?.space4 ?? 4}px`,
            }}
          >
            {eyebrow}
          </span>
        )}
        <h1
          style={{
            fontSize: `${typography?.pageTitle ?? 24}px`,
            fontWeight: 800,
            color: colors?.textPrimary || 'var(--text-primary, #F3F4F6)',
            letterSpacing: '-0.02em',
            margin: 0,
            lineHeight: 1.25,
          }}
        >
          {title}
        </h1>
        {description && (
          <p
            style={{
              fontSize: `${typography?.bodySm ?? 14}px`,
              color: colors?.textSecondary || 'var(--text-secondary, #9CA3AF)',
              marginTop: `${spacing?.space4 ?? 4}px`,
              marginBottom: 0,
              lineHeight: 1.5,
            }}
          >
            {description}
          </p>
        )}
      </div>

      {actions}
    </div>
  );
}
