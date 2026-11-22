/** Planner-only Notes / Tasks / Documents storage for each Planner task (PlannerRow). Never shared with Compliance. */
import { base44 } from '@/api/base44Client';
import { makeTaskStore } from '@/lib/obligationTasks';

export const PLANNER_ROW_TYPE = 'planner_row';
export const PLANNER_NOTE_ENTITY = 'PlannerTaskNote';
export const PLANNER_DOC_ENTITIES = { document: 'PlannerTaskDocument', folder: 'PlannerTaskDocumentFolder' };
export const PLANNER_TASK_STORE = makeTaskStore('PlannerSubtask');

export const plannerTasksKey = (rowId) => ['workspaceTasks', PLANNER_ROW_TYPE, rowId];

/** Cascade: remove all Notes, Tasks and Documents owned by the given Planner rows. */
export async function deleteRowWorkspaces(rowIds) {
  if (!rowIds.length) return;
  const byObject = { object_id: { $in: rowIds } };
  const byParent = { parent_id: { $in: rowIds } };
  const E = base44.entities;
  await Promise.all([
    E.PlannerTaskNote.deleteMany(byObject),
    E.PlannerTaskDocument.deleteMany(byObject),
    E.PlannerTaskDocumentFolder.deleteMany(byObject),
    E.PlannerSubtask.deleteMany(byParent),
  ]);
}