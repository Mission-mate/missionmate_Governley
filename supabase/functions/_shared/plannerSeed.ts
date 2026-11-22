/**
 * Idempotent planner grid seeding (Program and Project planners).
 *
 * Every step checks what already exists before creating anything, so a failed
 * run can be repeated against the same planner and only fills in what is missing.
 * User edits are never overwritten: existing columns, sections and rows are kept.
 */
import { withRetry } from './cascadeKit.ts';

/** Locked system columns, always present in this order. */
export const SYSTEM_COLUMNS = [
  { system_key: 'owner', title: 'Owner', type: 'People', config: {} },
  { system_key: 'due_date', title: 'Due Date', type: 'Date', config: {} },
  { system_key: 'status', title: 'Status', type: 'Single Select', config: { options: [
    { name: 'Not Started', color: 'gray' }, { name: 'In Progress', color: 'blue' }, { name: 'Completed', color: 'green' },
    { name: 'On Hold', color: 'orange' }, { name: 'Cancelled', color: 'red' },
  ] } },
  { system_key: 'priority', title: 'Priority', type: 'Single Select', config: { options: [
    { name: 'High', color: 'red' }, { name: 'Medium', color: 'orange' }, { name: 'Low', color: 'green' },
  ] } },
];

const STARTER_SECTION = 'Planning and Scoping';
const STARTER_ROW = 'Develop an annual business plan for each division';

export const PLANNER_SOURCES: Record<string, { planner: string; owner: string; parentField: string }> = {
  program: { planner: 'ProgramPlanner', owner: 'Program', parentField: 'program_id' },
  project: { planner: 'ProjectPlanner', owner: 'Project', parentField: 'project_id' },
};

const page = async (entity: any, query: Record<string, unknown>, sort: string, limit: number) => {
  const res = await entity.filter(query, { sort, limit });
  return res.items || [];
};

/** Ensures each system column exists once, adopting matching legacy columns so their cell values are kept. */
async function ensureSystemColumns(E: any, plannerId: string) {
  const columns = await withRetry('planner columns', () => page(E.PlannerColumn, { planner_id: plannerId }, 'created_date', 200));
  for (const [i, def] of SYSTEM_COLUMNS.entries()) {
    const matches = columns.filter((c: any) => c.system_key === def.system_key);
    if (matches.length > 1) {
      // A concurrent repair created a duplicate: keep the oldest, drop extras that hold no values.
      for (const extra of matches.slice(1)) {
        const used = await withRetry('planner column values', () => E.PlannerCellValue.count({ column_id: extra.id }));
        if (!used) await withRetry('duplicate column', () => E.PlannerColumn.delete(extra.id));
      }
      continue;
    }
    if (matches.length === 1) continue;
    const legacy = columns.find((c: any) => !c.system_key && c.type === def.type && c.title?.trim().toLowerCase() === def.title.toLowerCase());
    if (legacy) {
      const patch: Record<string, unknown> = { system_key: def.system_key, title: def.title };
      if (def.system_key !== 'status') patch.config = def.config;
      await withRetry(`${def.title} column`, () => E.PlannerColumn.update(legacy.id, patch));
      Object.assign(legacy, patch);
    } else {
      const created = await withRetry(`${def.title} column`, () => E.PlannerColumn.create({ planner_id: plannerId, ...def, order_index: i }));
      columns.push(created);
    }
  }
}

/** Starter section and task — only created when the planner has none yet. */
async function ensureStarterContent(E: any, plannerId: string) {
  const q = { planner_id: plannerId };
  const [section] = await withRetry('planner sections', () => page(E.PlannerSection, q, 'order_index', 1));
  const target = section || await withRetry('starter section', () => E.PlannerSection.create({ ...q, title: STARTER_SECTION, order_index: 0 }));
  const rows = await withRetry('planner tasks', () => E.PlannerRow.count(q));
  if (!rows) await withRetry('starter task', () => E.PlannerRow.create({ ...q, section_id: target.id, title: STARTER_ROW, order_index: 0 }));
}

/**
 * Completes a planner's grid. A planner still in setup gets the full starter grid;
 * an established planner only gets missing system columns, never extra content.
 * Marks the planner ready once everything is confirmed.
 */
export async function ensurePlannerGrid(E: any, entityName: string, planner: any) {
  await ensureSystemColumns(E, planner.id);
  if (planner.setup_status === 'pending') await ensureStarterContent(E, planner.id);
  if (planner.setup_status !== 'ready') {
    return withRetry('planner status', () => E[entityName].update(planner.id, { setup_status: 'ready' }));
  }
  return planner;
}