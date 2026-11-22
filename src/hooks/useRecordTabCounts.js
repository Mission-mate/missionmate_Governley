import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { countTasks, checklistItemsKey } from '@/lib/obligationTasks';
import { countFolderRows } from '@/lib/documentFolders';

/** Query key for a deliverable's top-level task & milestone count (seeded by Level5TaskPanel). */
export const level5TaskCountKey = (blockId) => ['level5Tasks', blockId, 'count'];

/**
 * One server-side count for a tab badge. Keys extend the tab's own query key, so
 * the tab's existing invalidation after add/delete refreshes the badge too.
 * A count that never succeeded stays undefined (badge hidden, never a false 0);
 * a failed refresh keeps the last good number. Single retry only.
 */
function useCount(queryKey, queryFn, enabled) {
  const { data } = useQuery({ queryKey, queryFn, enabled, retry: 1 });
  return data;
}

/**
 * Tab badge counts for one record's Notes / Documents (/ Tasks) tabs.
 * The Documents badge counts the folders the tab lists, not the files inside them.
 *
 * notes: 'page' — full-page NotesTab, 'pane' — side-pane PageNotesTab, false — no badge.
 * tasks: false | 'level5' (deliverable tasks & milestones) | 'workspace'
 *        (task groups in the two-panel task workspace, keyed by objectType).
 * obligations: true — count a grant's reporting obligations.
 */
export default function useRecordTabCounts(objectType, objectId, { notes = 'page', documents = true, tasks = false, obligations = false } = {}) {
  const enabled = !!objectType && !!objectId;
  const query = { object_type: objectType, object_id: objectId };

  const noteCount = useCount(
    [notes === 'page' ? 'notePagesTab' : 'notePages', objectType, objectId, 'count'],
    () => base44.entities.NotePage.count(query),
    enabled && notes !== false
  );
  const documentCount = useCount(
    ['documents', objectType, objectId, 'count'],
    () => countFolderRows(query),
    enabled && documents
  );

  const taskSpec = !tasks ? null
    : tasks === 'level5' ? {
        key: level5TaskCountKey(objectId),
        fn: () => base44.entities.Level5Task.count({ block_id: objectId, type: { $ne: 'section' } }),
      }
    : { key: [...checklistItemsKey(objectType, objectId), 'count'], fn: () => countTasks({ type: objectType, id: objectId }) };
  const taskCount = useCount(taskSpec?.key || ['no-task-count'], taskSpec?.fn || (() => 0), enabled && !!taskSpec);

  // Grant reporting obligations — key extends the page's ['reporting-obligations', id] query.
  const obligationCount = useCount(
    ['reporting-obligations', objectId, 'count'],
    () => base44.entities.ReportingObligation.count({ grant_id: objectId }),
    enabled && obligations
  );

  return {
    notes: notes === false ? undefined : noteCount,
    documents: documents ? documentCount : undefined,
    tasks: taskSpec ? taskCount : undefined,
    obligations: obligations ? obligationCount : undefined,
  };
}