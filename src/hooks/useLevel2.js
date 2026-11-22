import { useQuery, useQueryClient } from '@tanstack/react-query';
import { listLevel2 } from '@/lib/strategyLevel2';

/** Level 2 pillars for a strategy, shared across the workspace tabs. */
export function useLevel2(strategyId) {
  const qc = useQueryClient();
  const query = useQuery({
    queryKey: ['strategy_level2', strategyId],
    queryFn: () => listLevel2(strategyId),
    enabled: !!strategyId,
  });
  return {
    level2: query.data || [],
    refreshLevel2: () => qc.invalidateQueries({ queryKey: ['strategy_level2', strategyId] }),
  };
}