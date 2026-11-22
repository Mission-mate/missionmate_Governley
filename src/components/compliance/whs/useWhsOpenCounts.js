import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';

const COUNTED = { hazards: 'WhsHazard', incidents: 'WhsIncident', checks: 'WhsSafetyCheck', actions: 'WhsAction' };

/** Open-record counts per WHS tab key. Shares the 'whsStatusCounts' prefix so record changes refresh it. */
export default function useWhsOpenCounts(registerId) {
  const { data = {} } = useQuery({
    queryKey: ['whsStatusCounts', registerId, 'openTabs'],
    queryFn: async () => {
      const entries = await Promise.all(Object.entries(COUNTED).map(async ([tab, entity]) =>
        [tab, await base44.entities[entity].count({ register_id: registerId, status: 'Open' })]));
      return Object.fromEntries(entries);
    },
  });
  return data;
}