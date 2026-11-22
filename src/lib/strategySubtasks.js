/** Parent-task cascades for Strategy / Program / Project checklists. */
import { base44 } from '@/api/base44Client';
import { deleteAllWhere } from '@/lib/cascadeDelete';

const S = (store) => base44.entities[store.subtask];

/** Completing a task marks every checklist item Completed; reopening returns only Completed ones to Not Started. */
export const setTaskSubtasksCompleted = (store, taskId, completed) => (completed
  ? S(store).updateMany({ task_id: taskId, status: { $ne: 'Completed' } }, { $set: { status: 'Completed' } })
  : S(store).updateMany({ task_id: taskId, status: 'Completed' }, { $set: { status: 'Not Started' } }));

export const deleteSubtasksOfTask = (store, taskId) => deleteAllWhere(store.subtask, { task_id: taskId });