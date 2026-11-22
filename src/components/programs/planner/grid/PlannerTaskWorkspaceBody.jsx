import React from 'react';
import PageNotesTab from '@/components/notes/pages/PageNotesTab';
import TaskWorkspaceTab from '@/components/compliance/tasks/TaskWorkspaceTab';
import DocumentsTab from '@/components/documents/DocumentsTab';
import { useAuth } from '@/lib/AuthContext';
import {
  PLANNER_ROW_TYPE, PLANNER_NOTE_ENTITY, PLANNER_TASK_STORE, PLANNER_DOC_ENTITIES,
} from '@/lib/programs/plannerTaskWorkspace';

/**
 * Notes (paged list), Checklist (grouped) and Documents for one Planner task — Planner-only storage.
 * `readOnly` follows the pane's view/edit mode; `noteActionsRef` lets the pane footer save the open note.
 */
export default function PlannerTaskWorkspaceBody({ tab, row, readOnly, onDirtyChange, noteActionsRef }) {
  const { user } = useAuth();
  if (tab === 'notes') {
    return (
      <PageNotesTab key={`${row.id}-${readOnly ? 'view' : 'edit'}`} objectType={PLANNER_ROW_TYPE} objectId={row.id} noteEntity={PLANNER_NOTE_ENTITY}
        readOnly={readOnly} flush onDirtyChange={onDirtyChange} actionsRef={noteActionsRef} />
    );
  }
  if (tab === 'tasks') {
    return (
      <TaskWorkspaceTab key={row.id} parentType={PLANNER_ROW_TYPE} parentId={row.id} store={PLANNER_TASK_STORE}
        readOnly={readOnly} onDirtyChange={onDirtyChange} />
    );
  }
  return (
    <DocumentsTab objectType={PLANNER_ROW_TYPE} objectId={row.id} currentUser={user} entities={PLANNER_DOC_ENTITIES} hideTitle readOnly={readOnly} compact />
  );
}