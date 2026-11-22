import { useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';

const COMPLETED = 'Completed';

/** Checklist totals per Planner task: { [rowId]: { done, total } }. Live-updates on checklist changes. */
export default function usePlannerChecklistCounts(rowIds) {
  const ids = [...rowIds].sort();
  const query = useQuery({
    queryKey: ['plannerChecklistCounts', ids],
    enabled: ids.length > 0,
    queryFn: async () => {
      const E = base44.entities.PlannerSubtask;
      const base = { parent_id: { $in: ids } };
      const [all, done] = await Promise.all([
        E.aggregate({ query: base, groupBy: 'parent_id' }),
        E.aggregate({ query: { ...base, status: COMPLETED }, groupBy: 'parent_id' }),
      ]);
      const map = {};
      (all.rows || []).forEach((r) => { map[r.parent_id] = { total: r.count, done: 0 }; });
      (done.rows || []).forEach((r) => { if (map[r.parent_id]) map[r.parent_id].done = r.count; });
      return map;
    },
  });
  const { refetch } = query;
  useEffect(() => base44.entities.PlannerSubtask.subscribe(() => refetch()), [refetch]);
  return query.data || {};
}