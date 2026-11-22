/** Shared flat checklist data layer — compliance obligations, work items, actions, Planner and Strategy tasks. */
import { base44 } from '@/api/base44Client';
import { localToday } from '@/lib/localClock';
import { OPTION_COLORS } from '@/lib/registerColors';
import { deleteAllWhere } from '@/lib/cascadeDelete';

const NEUTRAL = { id: 'grey', bg: 'bg-muted', text: 'text-muted-foreground', dot: 'bg-muted-foreground/40' };
const tone = (id) => OPTION_COLORS.find((c) => c.id === id) || NEUTRAL;

/** Fixed display order + colours — matches the obligation Status field palette. */
export const TASK_STATUSES = [
  { value: 'Not Started', tone: tone('blue') },
  { value: 'In Progress', tone: tone('orange') },
  { value: 'Completed', tone: tone('green') },
];

export const statusOf = (task) => task?.status || 'Not Started';
export const statusTone = (status) => (TASK_STATUSES.find((s) => s.value === status) || TASK_STATUSES[0]).tone;

export const isOverdue = (task) =>
  !!task.due_date && task.due_date < localToday() && statusOf(task) !== 'Completed';

const cleanTitle = (t, fallback) => String(t ?? '').trim() || fallback;

// Every query is scoped by a parent link { type, id }.
const scope = (parent) => ({ parent_type: parent.type, parent_id: parent.id });

/** Checklist query key for one parent record — tab badge keys extend it. */
export const checklistItemsKey = (parentType, parentId) => ['workspaceTasks', parentType, parentId];

/** Flat checklist persistence bound to one entity, so each module keeps its data isolated. */
export function makeTaskStore(taskEntity, scopeOf = scope) {
  const T = () => base44.entities[taskEntity];
  // parent.fields: optional denormalised links (e.g. block_id) stamped on every new record.
  const stamp = (parent) => ({ ...scopeOf(parent), ...(parent.fields || {}) });
  return {
    countTasks: (parent) => T().count(scopeOf(parent)),
    listTasks: (parent) => T().filter(scopeOf(parent), 'created_date'),
    reorderTasks: (orderedIds) => T().bulkUpdate(orderedIds.map((id, order_index) => ({ id, order_index }))),
    createTask: (parent, { title, status = 'Not Started', owner_name = '', due_date = '', order_index = 0 }) =>
      T().create({
        ...stamp(parent),
        title: cleanTitle(title, 'Untitled task'),
        status,
        order_index,
        owner_name: String(owner_name || '').trim(),
        ...(due_date ? { due_date } : {}),
      }),
    updateTask: (id, patch) => T().update(id, patch),
    deleteTask: (id) => T().delete(id),
    /** Cascade: remove every checklist item belonging to one parent record. */
    deleteTaskWorkspace: (parentType, parentId) => deleteAllWhere(taskEntity, { parent_type: parentType, parent_id: parentId }),
  };
}

/** Compliance / Board checklists (obligations, work items, meeting actions). */
export const COMPLIANCE_TASK_STORE = makeTaskStore('ObligationTask');

export const { countTasks, deleteTaskWorkspace, listTasks } = COMPLIANCE_TASK_STORE;