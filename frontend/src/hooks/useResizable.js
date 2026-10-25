import { useState, useCallback, useEffect } from 'react';

/**
 * useResizable - drag-to-resize hook for a panel.
 *
 * @param {object} opts
 * @param {number}  opts.initialSize  - starting width (px)
 * @param {number}  opts.min          - minimum allowed width (px)
 * @param {number}  opts.max          - maximum allowed width (px)
 * @param {'left'|'right'} opts.side  - which edge of the panel is being dragged
 *                                      'right'  → resize handle sits on the right edge (sidebar)
 *                                      'left'   → resize handle sits on the left  edge (tutor panel)
 * @returns {{ size, isResizing, handleMouseDown, resetSize }}
 */
export function useResizable({ initialSize, min, max, side = 'right' }) {
  const [size, setSize] = useState(initialSize);
  const [isResizing, setIsResizing] = useState(false);
  const [startX, setStartX] = useState(0);
  const [startSize, setStartSize] = useState(initialSize);

  const handleMouseDown = useCallback(
    (e) => {
      e.preventDefault();
      setIsResizing(true);
      setStartX(e.clientX);
      setStartSize(size);
    },
    [size]
  );

  useEffect(() => {
    if (!isResizing) return;

    const onMouseMove = (e) => {
      const delta = side === 'right'
        ? e.clientX - startX   // dragging the right handle → moving mouse right = bigger
        : startX - e.clientX;  // dragging the left  handle → moving mouse left  = bigger
      const next = Math.min(max, Math.max(min, startSize + delta));
      setSize(next);
    };

    const onMouseUp = () => setIsResizing(false);

    window.addEventListener('mousemove', onMouseMove);
    window.addEventListener('mouseup', onMouseUp);
    return () => {
      window.removeEventListener('mousemove', onMouseMove);
      window.removeEventListener('mouseup', onMouseUp);
    };
  }, [isResizing, startX, startSize, min, max, side]);

  const resetSize = useCallback(() => setSize(initialSize), [initialSize]);

  return { size, isResizing, handleMouseDown, resetSize };
}
