import { base44 } from '@/api/base44Client';
import { purgePlannerContents } from '@/lib/programs/plannerApi';

/**
 * Planner sources. Programs and Projects each own a separate entity; every query
 * is filtered by the source's parent field so records can never cross owners.
 */
export const PROGRAM_PLANNERS = {
  kind: 'program', entity: 'ProgramPlanner', parentField: 'program_id',
  heading: 'Program Planner',
  detailPath: (id) => `/programs/planners/${id}`,
  ownerPath: (ownerId) => `/programs/${ownerId}?tab=planner`,
};

export const PROJECT_PLANNERS = {
  kind: 'project', entity: 'ProjectPlanner', parentField: 'project_id',
  heading: 'Projects Planner',
  detailPath: (id) => `/projects/planners/${id}`,
  ownerPath: (ownerId) => `/projects/${ownerId}?tab=planner`,
};

export const plannersKey = (source, ownerId) => ['planners', source.kind, ownerId];

/** Server-side create (idempotent per setupKey) — resolves once the starter grid is confirmed. */
export async function createPlanner(source, ownerId, setupKey, data) {
  const res = await base44.functions.invoke('setupPlanner', { kind: source.kind, owner_id: ownerId, setup_key: setupKey, data });
  return res.data.planner;
}

/** Completes a planner still in setup, or adds missing system columns to an older planner. */
export async function repairPlanner(source, plannerId) {
  const res = await base44.functions.invoke('setupPlanner', { kind: source.kind, planner_id: plannerId });
  return res.data.planner;
}

export const isPlannerReady = (p) => p.setup_status !== 'pending';

/** Lists an owner's planners. Planners left mid-setup are repaired first and stay hidden until ready. */
export async function listPlanners(source, ownerId) {
  const list = await base44.entities[source.entity].filter({ [source.parentField]: ownerId }, '-created_date', 1000);
  const pending = list.filter((p) => !isPlannerReady(p));
  if (!pending.length) return list;
  const repaired = await Promise.allSettled(pending.map((p) => repairPlanner(source, p.id)));
  const fixed = Object.fromEntries(repaired.filter((r) => r.status === 'fulfilled').map((r) => [r.value.id, r.value]));
  return list.map((p) => fixed[p.id] || p).filter(isPlannerReady);
}

/** Deletes planners together with all of their grid contents. */
export async function deletePlanners(source, ids) {
  await purgePlannerContents(ids);
  await base44.entities[source.entity].deleteMany({ id: { $in: ids } });
}