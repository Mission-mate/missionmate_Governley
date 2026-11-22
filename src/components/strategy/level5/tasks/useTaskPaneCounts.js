import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { useTaskStore, checklistKey } from '@/lib/tasks/taskStore';

/**
 * Server-side tab badge counts for the open task pane. Each key extends its tab's
 * own query key, so the tab's existing invalidation refreshes the badge.
 */
export default function useTaskPaneCounts(taskId, { enabled = false } = {}) {
  const store = useTaskStore();
  const { data: noteCount } = useQuery({
    queryKey: ['notePages', store.notesType, taskId, 'count'],
    queryFn: () => base44.entities.NotePage.count({ object_type: store.notesType, object_id: taskId }),
    enabled: !!taskId && enabled,
    retry: 1,
  });
  const { data: checklistCount } = useQuery({
    queryKey: [...checklistKey(store, taskId), 'count'],
    queryFn: () => store.checklist.countTasks({ id: taskId }),
    enabled: !!taskId && enabled,
    retry: 1,
  });
  return enabled ? { Notes: noteCount, Checklist: checklistCount } : {};
}