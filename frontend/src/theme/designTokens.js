/**
 * Cipherium AI - Central Design Tokens
 *
 * Provides responsive breakpoints, 8px grid spacing, layout dimensions,
 * typography scales, CSS-variable-backed color definitions, and shared card styles.
 */

/**
 * Responsive viewport breakpoints in pixels.
 */
export const breakpoints = {
  sm: 640,
  md: 768,
  lg: 1024,
  xl: 1280,
  xxl: 1600,
};

/**
 * Consistent 8px multiple spacing scale (plus 4px half-step).
 */
export const spacing = {
  space0: 0,
  space4: 4,
  space8: 8,
  space12: 12,
  space16: 16,
  space20: 20,
  space24: 24,
  space32: 32,
  space40: 40,
  space48: 48,
  space64: 64,
};

/**
 * App-wide shell and grid layout dimensions.
 */
export const layout = {
  sidebarExpanded: 240,
  sidebarCollapsed: 72,
  topbarHeight: 56,
  pageMaxWidth: 1600,
  gridColumns: 12,
  gridGap: 24,
  sectionGap: 32,
  cardPadding: 24,
  cardPaddingSm: 20,
};

/**
 * Responsive outer page gutters / side padding.
 */
export const sidePadding = {
  mobile: 24,
  tablet: 32,
  desktop: 40,
};

/**
 * Typography font sizes and font families.
 */
export const typography = {
  pageTitle: 24,
  sectionTitle: 18,
  sectionTitleSm: 16,
  body: 16,
  bodySm: 14,
  caption: 12,
  fontSans: "'Plus Jakarta Sans', system-ui, -apple-system, sans-serif",
  fontMono: "'JetBrains Mono', monospace",
};

/**
 * Semantic theme colors referencing CSS custom properties with fallbacks.
 */
export const colors = {
  bgCanvas: 'var(--bg-canvas, #121214)',
  bgShell: 'var(--bg-shell, #161618)',
  bgSurface: 'var(--bg-surface, #1E1E22)',
  bgSurfaceElevated: 'var(--bg-surface-elevated, #222226)',
  bgHover: 'var(--bg-hover, #2A2A30)',
  borderStroke: 'var(--border-stroke, #2D2D35)',
  borderSubtle: 'var(--border-subtle, rgba(255, 255, 255, 0.08))',
  textPrimary: 'var(--text-primary, #F3F4F6)',
  textSecondary: 'var(--text-secondary, #9CA3AF)',
  textTertiary: 'var(--text-tertiary, #6B7280)',
  primaryBrand: 'var(--primary-brand, #6366F1)',
  primaryHover: 'var(--primary-hover, #4F46E5)',
  semanticSuccess: 'var(--semantic-success, #10B981)',
  semanticWarning: 'var(--semantic-warning, #F59E0B)',
  semanticDanger: 'var(--semantic-danger, #EF4444)',
};

/**
 * Reusable surface card container styles.
 */
export const cardStyles = {
  elevated: {
    background: 'var(--bg-surface, #1E1E22)',
    border: '1px solid var(--border-stroke, #2D2D35)',
    borderRadius: 12,
    boxShadow: '0 4px 20px -2px rgba(0, 0, 0, 0.5)',
  },
  flat: {
    background: 'var(--bg-surface, #1E1E22)',
    border: '1px solid var(--border-stroke, #2D2D35)',
    borderRadius: 12,
    boxShadow: 'none',
  },
};

/**
 * Generates a min-width CSS media query string from a breakpoint token name or pixel value.
 *
 * @param {'sm' | 'md' | 'lg' | 'xl' | 'xxl' | number} breakpointName - Named breakpoint key or numeric pixel threshold.
 * @returns {string} The CSS media query string, e.g. '@media (min-width: 1280px)'.
 *
 * @example
 * mediaQuery('xl'); // returns '@media (min-width: 1280px)'
 * mediaQuery(900);  // returns '@media (min-width: 900px)'
 */
export function mediaQuery(breakpointName) {
  const minWidth = typeof breakpointName === 'number'
    ? breakpointName
    : breakpoints[breakpointName];

  if (minWidth === undefined) {
    console.warn(
      `[designTokens] Unknown breakpoint: "${breakpointName}". Valid breakpoints are: ${Object.keys(breakpoints).join(', ')}`
    );
    return '@media (min-width: 0px)';
  }

  return `@media (min-width: ${minWidth}px)`;
}

const designTokens = {
  breakpoints,
  spacing,
  layout,
  sidePadding,
  typography,
  colors,
  cardStyles,
  mediaQuery,
};

export default designTokens;
