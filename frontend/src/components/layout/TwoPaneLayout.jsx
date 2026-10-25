import React, { useState, useEffect } from 'react';
import { breakpoints, layout } from '../../theme/designTokens.js';

/**
 * TwoPaneLayout
 *
 * Full-height split pane layout used for immersive, app-like pages like
 * Practice and AI Tutor.
 * - Left pane: 8 columns (by default) with internal scroll
 * - Right pane: 4 columns (by default) sticky with internal scroll
 * - Stacks vertically on screens below 1024px
 */
export default function TwoPaneLayout({
  left,
  right,
  leftColumns = 8,
  rightColumns = 4,
  gap = layout.gridGap,
  rightSticky = true,
  style = {},
  className = '',
  leftStyle = {},
  rightStyle = {},
}) {
  const [isStacked, setIsStacked] = useState(() => {
    if (typeof window === 'undefined') return false;
    return window.innerWidth < breakpoints.lg;
  });

  useEffect(() => {
    if (typeof window === 'undefined') return;

    const handleResize = () => {
      setIsStacked(window.innerWidth < breakpoints.lg);
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const containerStyle = {
    display: isStacked ? 'flex' : 'grid',
    flexDirection: isStacked ? 'column' : undefined,
    gridTemplateColumns: isStacked ? undefined : `repeat(${layout.gridColumns}, minmax(0, 1fr))`,
    gap: `${gap}px`,
    width: '100%',
    height: isStacked ? 'auto' : `calc(100dvh - ${layout.topbarHeight + 32}px)`,
    maxHeight: isStacked ? 'none' : `calc(100dvh - ${layout.topbarHeight + 32}px)`,
    overflow: isStacked ? 'visible' : 'hidden',
    boxSizing: 'border-box',
    ...style,
  };

  const leftPaneStyle = {
    gridColumn: isStacked ? '1 / -1' : `1 / span ${leftColumns}`,
    width: '100%',
    height: isStacked ? 'auto' : '100%',
    overflowY: isStacked ? 'visible' : 'auto',
    paddingRight: isStacked ? 0 : '4px',
    boxSizing: 'border-box',
    ...leftStyle,
  };

  const rightPaneStyle = {
    gridColumn: isStacked ? '1 / -1' : `${leftColumns + 1} / -1`,
    width: '100%',
    height: isStacked ? 'auto' : '100%',
    overflowY: isStacked ? 'visible' : 'auto',
    boxSizing: 'border-box',
    ...(rightSticky && !isStacked
      ? {
          position: 'sticky',
          top: 0,
          alignSelf: 'start',
        }
      : {}),
    ...rightStyle,
  };

  return (
    <div className={`two-pane-layout ${className}`.trim()} style={containerStyle}>
      <section className="two-pane-left" style={leftPaneStyle}>
        {left}
      </section>
      <aside className="two-pane-right" style={rightPaneStyle}>
        {right}
      </aside>
    </div>
  );
}
