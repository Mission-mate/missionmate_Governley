import { useState, useEffect, useCallback } from 'react';

/**
 * Local optimistic ordering for a level's rows + a drag-end handler.
 * Reordering is only enabled when not searching (the visible list must be the full set).
 */
export default function useRowReorder(rows, canReorder, onReorder) {
  const [order, setOrder] = useState(rows);
  useEffect(() => { setOrder(rows); }, [rows]);

  const onDragEnd = useCallback((result) => {
    if (!canReorder || !result.destination || result.destination.index === result.source.index) return;
    const next = Array.from(order);
    const [moved] = next.splice(result.source.index, 1);
    next.splice(result.destination.index, 0, moved);
    setOrder(next); // optimistic
    onReorder(next);
  }, [order, canReorder, onReorder]);

  return { order, onDragEnd };
}