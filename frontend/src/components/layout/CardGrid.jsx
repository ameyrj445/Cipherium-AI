import React from 'react';

/**
 * CardGrid
 * Generic responsive card grid component.
 *
 * Props:
 * - children (required): Card elements to arrange in the grid
 * - minWidth (number, default 340): Minimum card width in px for auto-fill
 * - gap (number, default 24): Gap between cards in px
 * - style (object, optional): Custom style overrides
 * - className (string, optional): Optional CSS class name
 * - columns (number, optional): If provided, uses fixed `repeat(columns, 1fr)` instead of auto-fill
 *
 * Behavior:
 * - Container with `display: grid; grid-template-columns: repeat(auto-fill, minmax(${minWidth}px, 1fr)); gap: ${gap}px;`
 * - If columns is provided, use `repeat(${columns}, 1fr)` instead
 * - No max-width constraint (inherits from parent PageContainer)
 */
export default function CardGrid({
  children,
  minWidth = 340,
  gap = 24,
  style = {},
  className = '',
  columns,
  ...rest
}) {
  const gridTemplateColumns = columns
    ? `repeat(${columns}, 1fr)`
    : `repeat(auto-fill, minmax(${typeof minWidth === 'number' ? `${minWidth}px` : minWidth}, 1fr))`;

  const gapValue = typeof gap === 'number' ? `${gap}px` : gap;

  return (
    <div
      className={className || undefined}
      style={{
        display: 'grid',
        gridTemplateColumns,
        gap: gapValue,
        width: '100%',
        boxSizing: 'border-box',
        ...style,
      }}
      {...rest}
    >
      {children}
    </div>
  );
}
