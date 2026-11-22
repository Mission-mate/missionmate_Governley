import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { getOrNull, loadFailure } from '@/lib/readState';

/** Loads a WHS register and one of its records; `record` is null if it is missing or belongs elsewhere. */
export default function useWhsRecord(entityName, registerId, recordId) {
  const reg = useQuery({
    queryKey: ['managedRegister', registerId],
    queryFn: () => getOrNull(() => base44.entities.ComplianceManagedRegister.get(registerId)),
  });
  const rec = useQuery({
    queryKey: ['whsRecord', entityName, recordId],
    queryFn: () => getOrNull(() => base44.entities[entityName].get(recordId)),
  });
  const record = rec.data && rec.data.register_id === registerId ? rec.data : null;
  return {
    register: reg.data, record, isLoading: reg.isLoading || rec.isLoading,
    failure: loadFailure(reg, rec), queryKey: ['whsRecord', entityName, recordId],
  };
}