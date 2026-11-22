import { useState, useCallback } from 'react';

/** Single-select row selection: toggle picks only that row (or clears it when already selected). */
export default function useRowSelectionSet() {
  const [selectedIds, setSelectedIds] = useState(new Set());
  const clear = useCallback(() => setSelectedIds(new Set()), []);
  const toggle = useCallback((id) => setSelectedIds((prev) => (prev.has(id) ? new Set() : new Set([id]))), []);
  return { selectedIds, toggle, clear };
}