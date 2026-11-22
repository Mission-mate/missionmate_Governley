/**
 * Shared cascade for removing Programs and Projects with everything they own.
 *
 * Ownership map (Program and Project each use their own entity set):
 *   Program { id }
 *     ├─ Project { program_id }                       → full Project cascade below
 *     └─ (same owner tree as a Project, with Program* entities)
 *   Project { id }
 *     ├─ ProjectDeliverable { project_id }
 *     │    ├─ ProjectDeliverableTask { deliverable_id }
 *     │    │    ├─ ProjectDeliverableSubtask { task_id | deliverable_id }
 *     │    │    └─ NotePage { 'project_deliverable_task', task id }
 *     │    ├─ ProjectDeliverableReport { deliverable_id }
 *     │    │    └─ NotePage { 'project_deliverable_report', report id }
 *     │    └─ NotePage / Document / DocumentFolder { 'project_deliverable', id }
 *     ├─ ProjectObligation { project_id }
 *     │    └─ NotePage / Document / DocumentFolder { 'project_obligation', id }
 *     ├─ ProjectPlanner { project_id }
 *     │    ├─ PlannerSection / PlannerColumn / PlannerRow / PlannerCellValue { planner_id }
 *     │    └─ per row: PlannerTaskNote / PlannerTaskDocument / PlannerTaskDocumentFolder
 *     │               { object_id: row id } and PlannerSubtask { parent_id: row id }
 *     └─ NotePage / Document / DocumentFolder { 'project', id }
 *
 * Children always go before parents; the Program / Project record is deleted
 * last, only after every owned collection has been drained and verified empty.
 * If any step fails the parent stays, and re-running continues safely.
 */
import { CascadeError, withRetry, chunks, collectIds, purge, purgeAttached, drain, deleteParent, runEach, add, type Tally } from './cascadeKit.ts';

export { CascadeError, runEach };

const OWNERS = {
  program: {
    entity: 'Program', key: 'program_id', objectType: 'program',
    deliverable: 'ProgramDeliverable', task: 'ProgramDeliverableTask', subtask: 'ProgramDeliverableSubtask', report: 'ProgramDeliverableReport',
    deliverableType: 'program_deliverable', taskNotes: 'program_deliverable_task', reportNotes: 'program_deliverable_report',
    obligation: 'ProgramObligation', obligationType: 'program_obligation', planner: 'ProgramPlanner',
  },
  project: {
    entity: 'Project', key: 'project_id', objectType: 'project',
    deliverable: 'ProjectDeliverable', task: 'ProjectDeliverableTask', subtask: 'ProjectDeliverableSubtask', report: 'ProjectDeliverableReport',
    deliverableType: 'project_deliverable', taskNotes: 'project_deliverable_task', reportNotes: 'project_deliverable_report',
    obligation: 'ProjectObligation', obligationType: 'project_obligation', planner: 'ProjectPlanner',
  },
};
type Owner = typeof OWNERS.program;

const ROW_ATTACHED = ['PlannerTaskNote', 'PlannerTaskDocument', 'PlannerTaskDocumentFolder'];
const GRID = ['PlannerCellValue', 'PlannerRow', 'PlannerColumn', 'PlannerSection'];

async function deleteDeliverables(svc: any, o: Owner, ids: string[], tally: Tally) {
  const byDeliverable = { deliverable_id: { $in: ids } };
  const taskIds = await withRetry(o.task, () => collectIds(svc[o.task], byDeliverable));
  const reportIds = await withRetry(o.report, () => collectIds(svc[o.report], byDeliverable));
  for (const t of chunks(taskIds)) add(tally, o.subtask, await purge(svc, o.subtask, { task_id: { $in: t } }));
  add(tally, o.subtask, await purge(svc, o.subtask, byDeliverable));
  await purgeAttached(svc, tally, o.taskNotes, taskIds, ['NotePage']);
  await purgeAttached(svc, tally, o.reportNotes, reportIds, ['NotePage']);
  add(tally, o.report, await purge(svc, o.report, byDeliverable));
  add(tally, o.task, await purge(svc, o.task, byDeliverable));
  await purgeAttached(svc, tally, o.deliverableType, ids);
  add(tally, o.deliverable, await purge(svc, o.deliverable, { id: { $in: ids } }));
}

async function deleteObligations(svc: any, o: Owner, ids: string[], tally: Tally) {
  await purgeAttached(svc, tally, o.obligationType, ids);
  add(tally, o.obligation, await purge(svc, o.obligation, { id: { $in: ids } }));
}

async function deletePlanners(svc: any, o: Owner, ids: string[], tally: Tally) {
  const byPlanner = { planner_id: { $in: ids } };
  const rowIds = await withRetry('PlannerRow', () => collectIds(svc.PlannerRow, byPlanner));
  for (const r of chunks(rowIds)) {
    // These entities are planner-only, so the row id alone scopes them (matches how they are written).
    for (const name of ROW_ATTACHED) add(tally, name, await purge(svc, name, { object_id: { $in: r } }));
    add(tally, 'PlannerSubtask', await purge(svc, 'PlannerSubtask', { parent_id: { $in: r } }));
  }
  for (const name of GRID) add(tally, name, await purge(svc, name, byPlanner));
  add(tally, o.planner, await purge(svc, o.planner, { id: { $in: ids } }));
}

/** Remove everything one Program or Project owns (not the record itself). */
async function clearOwner(svc: any, o: Owner, ownerId: string, tally: Tally) {
  const owned = { [o.key]: ownerId };
  await drain(svc, o.deliverable, owned, (ids) => deleteDeliverables(svc, o, ids, tally));
  await drain(svc, o.obligation, owned, (ids) => deleteObligations(svc, o, ids, tally));
  await drain(svc, o.planner, owned, (ids) => deletePlanners(svc, o, ids, tally));
  await purgeAttached(svc, tally, o.objectType, [ownerId]);
}

export async function cascadeDeleteProject(svc: any, projectId: string, tally: Tally = {}): Promise<Tally> {
  await clearOwner(svc, OWNERS.project, projectId, tally);
  await deleteParent(svc, 'Project', projectId);
  add(tally, 'Project', 1);
  return tally;
}

export async function cascadeDeleteProgram(svc: any, programId: string, tally: Tally = {}): Promise<Tally> {
  await drain(svc, 'Project', { program_id: programId }, async (ids) => {
    for (const id of ids) await cascadeDeleteProject(svc, id, tally);
  });
  await clearOwner(svc, OWNERS.program, programId, tally);
  await deleteParent(svc, 'Program', programId);
  add(tally, 'Program', 1);
  return tally;
}