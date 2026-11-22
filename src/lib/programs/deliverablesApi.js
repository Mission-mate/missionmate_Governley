import { base44 } from '@/api/base44Client';
import { PROGRAM_TASK_STORE, PROJECT_TASK_STORE } from '@/lib/tasks/taskStore';
import { PROGRAM_REPORT_STORE, PROJECT_REPORT_STORE } from '@/lib/tasks/reportStore';

/**
 * Data layer for Deliverables. Programs and Projects each own a fully separate set of
 * entities — an owner descriptor picks the set, so records can never cross owners.
 */
const E = base44.entities;

export const PROGRAM_OWNER = {
  kind: 'program', ownerKey: 'program_id', ownerEntity: 'Program',
  deliverable: 'ProgramDeliverable', task: 'ProgramDeliverableTask', subtask: 'ProgramDeliverableSubtask', report: 'ProgramDeliverableReport',
  objectType: 'program_deliverable', heading: 'Program Deliverables', columnLabel: 'Program Deliverables', taskStore: PROGRAM_TASK_STORE, reportStore: PROGRAM_REPORT_STORE,
  detailPath: (id) => `/programs/deliverables/${id}`,
  ownerPath: (id) => `/programs/${id}?tab=deliverables`,
};

export const PROJECT_OWNER = {
  kind: 'project', ownerKey: 'project_id', ownerEntity: 'Project',
  deliverable: 'ProjectDeliverable', task: 'ProjectDeliverableTask', subtask: 'ProjectDeliverableSubtask', report: 'ProjectDeliverableReport',
  objectType: 'project_deliverable', heading: 'Project Deliverable', columnLabel: 'Project Deliverables', iconColor: 'teal', taskStore: PROJECT_TASK_STORE, reportStore: PROJECT_REPORT_STORE,
  detailPath: (id) => `/projects/deliverables/${id}`,
  ownerPath: (id) => `/projects/${id}?tab=deliverables`,
};

export function makeDeliverablesApi(owner) {
  const D = E[owner.deliverable];
  const keys = {
    list: (ownerId) => [owner.deliverable, 'list', ownerId],
    one: (id) => [owner.deliverable, id],
  };

  async function deleteDeliverables(ids) {
    if (!ids.length) return;
    const byDeliverable = { deliverable_id: { $in: ids } };
    const byObject = { object_type: owner.objectType, object_id: { $in: ids } };
    const [tasks, reports] = await Promise.all([
      E[owner.task].filter(byDeliverable, 'order_index', 5000),
      E[owner.report].filter(byDeliverable, 'order_index', 5000),
    ]);
    await Promise.all([
      reports.length && E.NotePage.deleteMany({ object_type: owner.reportStore.notesType, object_id: { $in: reports.map((r) => r.id) } }),
      tasks.length && E.NotePage.deleteMany({ object_type: owner.taskStore.notesType, object_id: { $in: tasks.map((t) => t.id) } }),
      E[owner.subtask].deleteMany(byDeliverable),
      E[owner.task].deleteMany(byDeliverable),
      E[owner.report].deleteMany(byDeliverable),
      E.NotePage.deleteMany(byObject),
      E.Document.deleteMany(byObject),
    ]);
    await D.deleteMany({ id: { $in: ids } });
  }

  return {
    owner,
    keys,
    list: (ownerId) => D.filter({ [owner.ownerKey]: ownerId }, 'order_index'),
    get: (id) => D.get(id),
    update: (id, data) => D.update(id, data),
    reorder: (rows) => D.bulkUpdate(rows.map((d, i) => ({ id: d.id, order_index: i }))),
    async create(ownerId, data) {
      const count = await D.count({ [owner.ownerKey]: ownerId });
      return D.create({ ...data, [owner.ownerKey]: ownerId, order_index: count });
    },
    deleteDeliverables,
    countTasks: (deliverableId) => E[owner.task].count({ deliverable_id: deliverableId, type: { $ne: 'section' } }),
  };
}

export const programDeliverablesApi = makeDeliverablesApi(PROGRAM_OWNER);
export const projectDeliverablesApi = makeDeliverablesApi(PROJECT_OWNER);