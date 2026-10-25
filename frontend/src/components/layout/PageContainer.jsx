import React, { useState, useEffect } from 'react';
import { layout, sidePadding, breakpoints } from '../../theme/designTokens.js';

/**
 * PageContainer
 *
 * Primary layout container replacing per-page hardcoded max-width wrappers.
 * - Fluid width with responsive side gutters (24px mobile, 32px tablet, 40px desktop)
 * - 1600px max width, centered only on wide/ultra-wide screens
 * - 12-column CSS grid with 24px gap by default
 * - Supports fullHeight mode for app-like pages (Practice, AI Tutor)
 */
export default function PageContainer({
  children,
  fullHeight = false,
  as: Component = 'div',
  noGrid = false,
  noPadding = false,
  style = {},
  className = '',
  ...rest
}) {
  const [paddingX, setPaddingX] = useState(() => {
    if (typeof window === 'undefined') return sidePadding.desktop;
    const w = window.innerWidth;
    if (w < breakpoints.md) return sidePadding.mobile;
    if (w < breakpoints.xl) return sidePadding.tablet;
    return sidePadding.desktop;
  });

  useEffect(() => {
    if (typeof window === 'undefined') return;

    const handleResize = () => {
      const w = window.innerWidth;
      if (w < breakpoints.md) {
        setPaddingX(sidePadding.mobile);
      } else if (w < breakpoints.xl) {
        setPaddingX(sidePadding.tablet);
      } else {
        setPaddingX(sidePadding.desktop);
      }
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const containerStyles = {
    width: '100%',
    maxWidth: `${layout.pageMaxWidth}px`,
    marginLeft: 'auto',
    marginRight: 'auto',
    paddingLeft: noPadding ? 0 : `${paddingX}px`,
    paddingRight: noPadding ? 0 : `${paddingX}px`,
    paddingTop: noPadding ? 0 : '24px',
    paddingBottom: noPadding ? 0 : '32px',
    boxSizing: 'border-box',
    ...(fullHeight
      ? {
          height: `calc(100dvh - ${layout.topbarHeight}px)`,
          maxHeight: `calc(100dvh - ${layout.topbarHeight}px)`,
          overflow: 'hidden',
          display: 'flex',
          flexDirection: 'column',
          paddingBottom: '16px',
        }
      : {
          minHeight: `calc(100dvh - ${layout.topbarHeight}px)`,
        }),
    ...(!noGrid
      ? {
          display: 'grid',
          gridTemplateColumns: `repeat(${layout.gridColumns}, minmax(0, 1fr))`,
          columnGap: `${layout.gridGap}px`,
          rowGap: `${layout.gridGap}px`,
          alignItems: 'start',
        }
      : {}),
    ...style,
  };

  return (
    <Component className={`page-container ${className}`.trim()} style={containerStyles} {...rest}>
      {children}
    </Component>
  );
}
