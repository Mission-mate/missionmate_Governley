import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { localToday } from '@/lib/localClock';

export default function useResponsiblePeopleSummary(registerId) {
  const today = localToday();
  return useQuery({
    queryKey: ['responsiblePeopleSummary', registerId, today],
    queryFn: async () => {
      const current = { register_id: registerId, status: 'Current' };
      const [people, overdue] = await Promise.all([
        base44.entities.ResponsiblePerson.aggregate({ query: current, groupBy: 'person_type' }),
        base44.entities.ResponsiblePerson.count({ ...current, appointment_term: 'Custom', term_expiry_date: { $gte: '0001-01-01', $lt: today } }),
      ]);
      const groups = people.rows || [];
      return {
        current: groups.reduce((total, row) => total + row.count, 0),
        board: groups.find((row) => row.person_type === 'Board Member')?.count || 0,
        nonBoard: groups.find((row) => row.person_type === 'Non-Board Member')?.count || 0,
        overdue,
      };
    },
  });
}