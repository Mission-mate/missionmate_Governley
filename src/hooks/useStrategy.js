import { useQuery, useQueryClient } from '@tanstack/react-query';
import { getStrategy, listBlocks } from '@/lib/strategy';
import { getOrNull, loadFailure } from '@/lib/readState';

/** Single strategy + its blocks, shared across the strategy workspace tabs. */
export function useStrategy(id) {
  const qc = useQueryClient();
  const strategyQuery = useQuery({
    queryKey: ['strategy', id],
    queryFn: () => getOrNull(() => getStrategy(id)),
    enabled: !!id,
  });
  const blocksQuery = useQuery({
    queryKey: ['strategy_blocks', id],
    queryFn: () => listBlocks(id),
    enabled: !!id,
  });
  return {
    strategy: strategyQuery.data || null,
    blocks: blocksQuery.data || [],
    // First load only — background refreshes after a save never bring the loader back.
    isLoading: strategyQuery.isLoading || blocksQuery.isLoading,
    failure: loadFailure(strategyQuery, blocksQuery),
    refreshStrategy: () => qc.invalidateQueries({ queryKey: ['strategy', id] }),
    refreshBlocks: () => qc.invalidateQueries({ queryKey: ['strategy_blocks', id] }),
  };
}