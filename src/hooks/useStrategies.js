import { useQuery, useQueryClient } from '@tanstack/react-query';
import { listStrategies } from '@/lib/strategy';

/** Shared strategies query for the Strategy Register. */
export function useStrategies() {
  const qc = useQueryClient();
  const query = useQuery({
    queryKey: ['strategies'],
    queryFn: listStrategies,
  });
  return {
    ...query,
    strategies: query.data || [],
    refresh: () => qc.invalidateQueries({ queryKey: ['strategies'] }),
  };
}