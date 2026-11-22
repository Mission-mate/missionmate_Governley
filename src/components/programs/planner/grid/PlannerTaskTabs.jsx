import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { countFolderRows } from '@/lib/documentFolders';
import CapsuleTabs from '@/components/board/CapsuleTabs';
import {
  PLANNER_ROW_TYPE, PLANNER_NOTE_ENTITY, PLANNER_TASK_STORE, PLANNER_DOC_ENTITIES, plannerTasksKey,
} from '@/lib/programs/plannerTaskWorkspace';
import { listNotePages } from '@/lib/notePages';

/** Overview / Notes / Tasks / Documents switcher for one Planner task, with Planner-only badge counts. */
export default function PlannerTaskTabs({ rowId, value, onChange }) {
  const parent = { type: PLANNER_ROW_TYPE, id: rowId };
  // Shares the Notes tab's page-list cache, so the badge follows page create/delete.
  const { data: notes } = useQuery({ queryKey: ['notePages', PLANNER_ROW_TYPE, rowId], queryFn: () => listNotePages(PLANNER_ROW_TYPE, rowId, PLANNER_NOTE_ENTITY) });
  const { data: tasks } = useQuery({ queryKey: [...plannerTasksKey(rowId), 'count'], queryFn: () => PLANNER_TASK_STORE.countTasks(parent) });
  const { data: docs } = useQuery({
    queryKey: ['documents', PLANNER_ROW_TYPE, rowId, 'count'],
    queryFn: () => countFolderRows({ object_type: PLANNER_ROW_TYPE, object_id: rowId }, PLANNER_DOC_ENTITIES),
  });
  return (
    <CapsuleTabs animated value={value} onChange={onChange} className="w-fit" tabs={[
      { value: 'overview', label: 'Overview' },
      { value: 'tasks', label: 'Checklist', count: tasks || undefined },
      { value: 'notes', label: 'Notes', count: notes?.length || undefined },
      { value: 'documents', label: 'Documents', count: docs || undefined },
    ]} />
  );
}