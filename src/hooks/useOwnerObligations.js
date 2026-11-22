import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { ownerObligationsKey } from '@/lib/obligationSources';

/** Loads the obligations owned by one Program or Project (source picks the isolated entity). */
export default function useOwnerObligations(source, ownerId) {
  return useQuery({
    queryKey: ownerObligationsKey(source, ownerId),
    queryFn: () => base44.entities[source.entity].filter({ [source.parentField]: ownerId }, '-created_date', 1000),
    enabled: !!ownerId,
  });
}