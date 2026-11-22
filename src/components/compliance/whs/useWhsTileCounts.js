import { useQuery, keepPreviousData } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';

/**
 * Summary tile definitions and their server-side counts for a WHS tab.
 * The Total tile is register-wide; every other tile is scoped to the selected status tab.
 * `openOnly` tiles (overdue) are always 0 on Closed — closed records are never overdue.
 */
export default function useWhsTileCounts({ tabKey, cfg, registerId, status }) {
  const tiles = cfg.tiles().map((t) => ({ ...t, label: t.label === 'status' ? status : t.label }));
  const { data: counts = [], isLoading, ...read } = useQuery({
    queryKey: ['whsTiles', registerId, tabKey, status],
    queryFn: () => Promise.all(tiles.map((t) => {
      if (t.openOnly && status !== 'Open') return 0;
      const scope = t.total ? {} : { status };
      return base44.entities[cfg.entity].count({ register_id: registerId, ...t.query, ...scope });
    })),
    placeholderData: keepPreviousData,
  });
  return { tiles, counts, isLoading, failure: read };
}