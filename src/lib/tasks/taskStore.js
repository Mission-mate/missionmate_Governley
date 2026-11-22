import { createContext, useContext } from 'react';
import { makeTaskStore } from '@/lib/obligationTasks';

// Checklist records hang off their task by task_id; each module keeps its own entities.
const byTask = (parent) => ({ task_id: parent.id });

/**
 * Data scope for the shared Tasks & Milestones workspace. Strategy is the default;
 * Program / Project Deliverables provide their own dedicated entities so they never mix.
 */
export const STRATEGY_TASK_STORE = {
  task: 'Level5Task', subtask: 'Level5Subtask', parent: 'StrategyBlock', scope: 'block_id', notesType: 'strategy_task',
  checklist: makeTaskStore('Level5Subtask', byTask),
};
export const PROGRAM_TASK_STORE = {
  task: 'ProgramDeliverableTask', subtask: 'ProgramDeliverableSubtask', parent: 'ProgramDeliverable', scope: 'deliverable_id', notesType: 'program_deliverable_task',
  checklist: makeTaskStore('ProgramDeliverableSubtask', byTask),
};
export const PROJECT_TASK_STORE = {
  task: 'ProjectDeliverableTask', subtask: 'ProjectDeliverableSubtask', parent: 'ProjectDeliverable', scope: 'deliverable_id', notesType: 'project_deliverable_task',
  checklist: makeTaskStore('ProjectDeliverableSubtask', byTask),
};

/** Checklist query key for one task — the tab badge count key extends it. */
export const checklistKey = (store, taskId) => ['workspaceTasks', store.notesType, taskId];

const TaskStoreContext = createContext(STRATEGY_TASK_STORE);
export const TaskStoreProvider = TaskStoreContext.Provider;
export const useTaskStore = () => useContext(TaskStoreContext);