import React, { useState, useEffect } from 'react';
import { ChevronRight, ChevronLeft } from 'lucide-react';
import { breakpoints, layout } from '../../theme/designTokens.js';

/**
 * StickyRail
 *
 * Sticky side rail component for right-hand utility panels.
 * - Spans specified grid columns (e.g. 3 or 4 of 12) on desktop
 * - Adapts to span full width below main content on tablet/mobile (<1024px)
 * - Sticky with internal scrolling
 * - Optional collapsible state persisted in localStorage
 */
export default function StickyRail({
  children,
  id,
  columns = 4,
  sticky = true,
  maxHeight = `calc(100dvh - ${layout.topbarHeight + 32}px)`,
  collapsible = false,
  defaultCollapsed = false,
  style = {},
  className = '',
  ...rest
}) {
  const [isMobile, setIsMobile] = useState(() => {
    if (typeof window === 'undefined') return false;
    return window.innerWidth < breakpoints.lg;
  });

  const [collapsed, setCollapsed] = useState(() => {
    if (!collapsible) return false;
    if (id && typeof window !== 'undefined') {
      try {
        const saved = localStorage.getItem(`cipherium_rail_${id}`);
        if (saved !== null) return JSON.parse(saved);
      } catch (e) {
        // Fallback to default
      }
    }
    return defaultCollapsed;
  });

  useEffect(() => {
    if (typeof window === 'undefined') return;

    const handleResize = () => {
      setIsMobile(window.innerWidth < breakpoints.lg);
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const handleToggle = () => {
    const next = !collapsed;
    setCollapsed(next);
    if (id && typeof window !== 'undefined') {
      try {
        localStorage.setItem(`cipherium_rail_${id}`, JSON.stringify(next));
      } catch (e) {
        // Ignore storage errors
      }
    }
  };

  // On 12-col grid:
  // e.g. columns = 4 -> gridColumn: '9 / -1' (columns 9, 10, 11, 12)
  // e.g. columns = 3 -> gridColumn: '10 / -1' (columns 10, 11, 12)
  const startCol = 13 - columns;
  const gridColumn = isMobile ? '1 / -1' : `${startCol} / -1`;

  const railStyles = {
    gridColumn,
    width: '100%',
    boxSizing: 'border-box',
    ...(sticky && !isMobile
      ? {
          position: 'sticky',
          top: '24px',
          alignSelf: 'start',
          maxHeight,
          overflowY: 'auto',
        }
      : {}),
    ...style,
  };

  if (collapsible && collapsed && !isMobile) {
    return (
      <aside
        style={{
          gridColumn: '12 / -1',
          position: 'sticky',
          top: '24px',
          alignSelf: 'start',
          display: 'flex',
          justifyContent: 'flex-end',
        }}
      >
        <button
          type="button"
          onClick={handleToggle}
          title="Expand side panel"
          aria-label="Expand side panel"
          style={{
            padding: '8px',
            background: 'var(--bg-surface, #1E1E22)',
            border: '1px solid var(--border-stroke, #2D2D35)',
            borderRadius: '8px',
            color: 'var(--text-secondary, #9CA3AF)',
            cursor: 'pointer',
          }}
        >
          <ChevronLeft size={18} />
        </button>
      </aside>
    );
  }

  return (
    <aside className={`sticky-rail ${className}`.trim()} style={railStyles} {...rest}>
      {collapsible && !isMobile && (
        <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: '8px' }}>
          <button
            type="button"
            onClick={handleToggle}
            title="Collapse side panel"
            aria-label="Collapse side panel"
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '4px',
              background: 'transparent',
              border: 'none',
              color: 'var(--text-tertiary, #6B7280)',
              fontSize: '0.75rem',
              cursor: 'pointer',
              padding: '4px 6px',
            }}
          >
            <span>Hide</span>
            <ChevronRight size={14} />
          </button>
        </div>
      )}
      {children}
    </aside>
  );
}
