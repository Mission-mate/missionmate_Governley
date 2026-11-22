import { useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { buildTagMap, resolveTags as resolveTagIds } from '@/lib/tags';

/**
 * Single source of truth for the Tag registry on the client.
 *
 * Shares the ['tags'] react-query cache with every other tag consumer, so all
 * the tables, panes, pickers and filter panels resolve tags from one cached
 * fetch instead of each firing its own request on mount.
 *
 * Returns:
 *   tags        — the raw Tag registry list
 *   tagMap      — id -> { id, name, color }
 *   resolveTags — (ids) => [{ id, name, color }], unknown ids dropped
 */
export function useTags() {
  const { data: tags = [], isLoading } = useQuery({
    queryKey: ['tags'],
    queryFn: () => base44.entities.Tag.list(),
  });

  const tagMap = useMemo(() => buildTagMap(tags), [tags]);

  const resolve = useMemo(() => (ids) => resolveTagIds(ids, tagMap), [tagMap]);

  return { tags, tagMap, resolveTags: resolve, isLoading };
}