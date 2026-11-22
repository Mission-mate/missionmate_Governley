import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';

/** Total linked records (any status/stage). Keyed under 'whsLinked' so linked-record edits refresh it. */
export default function useLinkedCount(entityName, query) {
  const { data } = useQuery({
    queryKey: ['whsLinked', entityName, query, 'total'],
    queryFn: () => base44.entities[entityName].count(query),
    enabled: Object.values(query).every(Boolean),
  });
  return data;
}