import { base44 } from '@/api/base44Client';
import { deleteRowWorkspaces } from '@/lib/programs/plannerTaskWorkspace';

/** Planner grid data layer. Every record is scoped by planner_id. */
const E = base44.entities;

export const PLANNER_COLUMN_TYPES = ['Single Select', 'Multi Select', 'Date', 'People', 'Text/Number', 'Progress'];
export const LIST_TYPES = ['Multi Select', 'People'];

export const plannerGridKey = (plannerId) => ['plannerGrid', plannerId];
export const cellKey = (rowId, columnId) => `${rowId}:${columnId}`;
export const nextOrder = (list) => list.reduce((m, x) => Math.max(m, x.order_index ?? 0), -1) + 1;

/** Locked system columns, in display order. Created and repaired server-side by the setupPlanner function. */
const SYSTEM_ORDER = ['owner', 'due_date', 'status', 'priority'];
export const isSystemColumn = (c) => !!c?.system_key;
export const customColumns = (columns) => columns.filter((c) => !c.system_key);

const sortColumns = (columns) => {
  const rank = (c) => (c.system_key ? SYSTEM_ORDER.indexOf(c.system_key) : SYSTEM_ORDER.length);
  return [...columns].sort((a, b) => rank(a) - rank(b) || (a.order_index ?? 0) - (b.order_index ?? 0));
};

export async function loadPlannerGrid(plannerId) {
  const q = { planner_id: plannerId };
  const [sections, columns, rows, cells] = await Promise.all([
    E.PlannerSection.filter(q, 'order_index', 1000),
    E.PlannerColumn.filter(q, 'order_index', 200),
    E.PlannerRow.filter(q, 'order_index', 5000),
    E.PlannerCellValue.filter(q, 'created_date', 20000),
  ]);
  return { sections, columns: sortColumns(columns), rows, cells };
}

/** Reads a cell's value in the shape its column type uses. */
export function readCell(cell, column) {
  if (!cell) return LIST_TYPES.includes(column.type) ? [] : '';
  return LIST_TYPES.includes(column.type) ? (cell.values || []) : (cell.value ?? '');
}

/** The planner's system Status column. */
export const findStatusColumn = (columns) => columns.find((c) => c.system_key === 'status');
export const isPriorityColumn = (c) => c.system_key === 'priority';
export const COMPLETED = 'Completed';

/** Sets one task's Status cell value. */
export async function setRowStatus(plannerId, rowId, column, value, cellMap) {
  const existing = cellMap[cellKey(rowId, column.id)];
  if (existing) return E.PlannerCellValue.update(existing.id, { value });
  return E.PlannerCellValue.create({ planner_id: plannerId, row_id: rowId, column_id: column.id, value });
}

const isEmpty = (v) => v === '' || v == null || (Array.isArray(v) && v.length === 0);

/** Persists a task's cell values: creates, updates or removes one record per column. */
export async function saveRowCells(plannerId, rowId, columns, draft, cellMap) {
  await Promise.all(columns.map((col) => {
    const existing = cellMap[cellKey(rowId, col.id)];
    const raw = draft[col.id];
    const value = Array.isArray(raw) ? raw.map((s) => s.trim()).filter(Boolean) : raw;
    if (isEmpty(value)) return existing ? E.PlannerCellValue.delete(existing.id) : null;
    const data = LIST_TYPES.includes(col.type) ? { values: value } : { value: String(value) };
    if (existing) return E.PlannerCellValue.update(existing.id, data);
    return E.PlannerCellValue.create({ planner_id: plannerId, row_id: rowId, column_id: col.id, ...data });
  }));
}

/** Persists a section's task order (and section membership) after a move. */
export async function reorderRows(rows, sectionId) {
  if (!rows.length) return;
  await E.PlannerRow.bulkUpdate(rows.map((r, i) => ({ id: r.id, section_id: sectionId, order_index: i })));
}

/** Moves a section one slot (dir -1/+1) within its planner; its tasks stay attached via section_id. */
export async function moveSection(sections, sectionId, dir) {
  const list = [...sections];
  const i = list.findIndex((s) => s.id === sectionId);
  const j = i + dir;
  if (i < 0 || j < 0 || j >= list.length) return;
  [list[i], list[j]] = [list[j], list[i]];
  await E.PlannerSection.bulkUpdate(list.map((s, k) => ({ id: s.id, order_index: k })));
}

export async function deleteRow(rowId) {
  await deleteRowWorkspaces([rowId]);
  await E.PlannerCellValue.deleteMany({ row_id: rowId });
  await E.PlannerRow.delete(rowId);
}

export async function deleteSection(section) {
  const rows = await E.PlannerRow.filter({ section_id: section.id }, 'order_index', 5000);
  const ids = rows.map((r) => r.id);
  await deleteRowWorkspaces(ids);
  if (rows.length) await E.PlannerCellValue.deleteMany({ row_id: { $in: ids } });
  await E.PlannerRow.deleteMany({ section_id: section.id });
  await E.PlannerSection.delete(section.id);
}

export async function deleteColumn(columnId) {
  await E.PlannerCellValue.deleteMany({ column_id: columnId });
  await E.PlannerColumn.delete(columnId);
}

/** Removes every section, column, task and cell owned by the given planners. */
export async function purgePlannerContents(plannerIds) {
  if (!plannerIds.length) return;
  const q = { planner_id: { $in: plannerIds } };
  const rows = await E.PlannerRow.filter(q, 'order_index', 5000);
  await deleteRowWorkspaces(rows.map((r) => r.id));
  await Promise.all([E.PlannerCellValue.deleteMany(q), E.PlannerRow.deleteMany(q), E.PlannerColumn.deleteMany(q), E.PlannerSection.deleteMany(q)]);
}