import { useQuery, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';

/**
 * Manages saved Smart Lists (named filter presets) for a given module.
 */
export function useSmartLists(objectType = 'contacts') {
  const qc = useQueryClient();

  const { data: smartLists = [], isLoading } = useQuery({
    queryKey: ['smart-lists', objectType],
    queryFn: () => base44.entities.SmartList.filter({ object_type: objectType }, '-created_date'),
  });

  const refresh = () => qc.invalidateQueries({ queryKey: ['smart-lists', objectType] });

  const createSmartList = async (name, filters) => {
    await base44.entities.SmartList.create({ name, object_type: objectType, filters });
    await refresh();
  };

  const deleteSmartList = async (id) => {
    await base44.entities.SmartList.delete(id);
    await refresh();
  };

  return { smartLists, isLoading, createSmartList, deleteSmartList, refresh };
}