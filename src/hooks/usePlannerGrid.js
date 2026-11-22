import { useMemo } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { loadPlannerGrid, plannerGridKey, cellKey, findStatusColumn, readCell, COMPLETED } from '@/lib/programs/plannerApi';

const STATUS_RANK = { 'Not Started': 0, 'In Progress': 1, 'On Hold': 2, [COMPLETED]: 4 };

const EMPTY = { sections: [], columns: [], rows: [], cells: [] };

/** Loads one planner's sections, columns, tasks and cells, indexed for rendering. */
export default function usePlannerGrid(plannerId) {
  const qc = useQueryClient();
  const { data = EMPTY, isLoading, ...read } = useQuery({
    queryKey: plannerGridKey(plannerId),
    queryFn: () => loadPlannerGrid(plannerId),
    enabled: !!plannerId,
  });

  const cellMap = useMemo(() => Object.fromEntries(data.cells.map((c) => [cellKey(c.row_id, c.column_id), c])), [data.cells]);
  const rowsBySection = useMemo(() => {
    // Status order wins over manual order; manual order breaks ties (sort is stable).
    const statusCol = findStatusColumn(data.columns);
    const rank = (r) => {
      const s = statusCol ? readCell(cellMap[cellKey(r.id, statusCol.id)], statusCol) : '';
      return STATUS_RANK[s] ?? (s ? 3 : 0);
    };
    const map = {};
    data.rows.forEach((r) => { (map[r.section_id] ||= []).push(r); });
    Object.values(map).forEach((list) => list.sort((a, b) => rank(a) - rank(b)));
    return map;
  }, [data.rows, data.columns, cellMap]);

  const refresh = () => qc.invalidateQueries({ queryKey: plannerGridKey(plannerId) });
  return { ...data, cellMap, rowsBySection, isLoading, failure: read, refresh };
}