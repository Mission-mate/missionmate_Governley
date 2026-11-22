import { useState, useCallback, useMemo } from 'react';

/**
 * Single-select row selection shared by every strategy level table.
 * Toggling the selection always exits Move mode so the drag handle only
 * appears after the user explicitly clicks Move on a single selected row.
 */
export default function useRowSelection() {
  const [ids, setIds] = useState([]);
  const [moveMode, setMoveMode] = useState(false);

  const toggle = useCallback((id) => {
    setMoveMode(false);
    setIds((prev) => (prev.includes(id) ? [] : [id]));
  }, []);

  const clear = useCallback(() => {
    setMoveMode(false);
    setIds([]);
  }, []);

  const selectedIds = useMemo(() => new Set(ids), [ids]);

  return { ids, selectedIds, toggle, clear, moveMode, setMoveMode };
}