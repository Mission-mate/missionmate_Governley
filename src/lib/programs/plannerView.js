// Shared search / filter / group / sort for Planner List and Board views.
// Planner columns are exposed in the task-toolbar column shape so TaskToolbar and taskExport can be reused.
import { sortRows } from '@/lib/registerSort';
import { readCell, cellKey, LIST_TYPES, COMPLETED } from '@/lib/programs/plannerApi';

const VIEW_KEYS = ['owner', 'status', 'priority'];
const NO_VALUE = 'No value';

/** All planner columns in task-toolbar shape (custom kind, keyed by column id). */
export const toViewColumns = (columns) => columns.map((c) => ({ kind: 'custom', id: c.id, title: c.title, label: c.title, type: c.type, config: c.config || {}, system_key: c.system_key }));

/** Owner, Status and Priority — the Group / Filter fields. */
export const viewFields = (viewColumns) => VIEW_KEYS.map((k) => viewColumns.find((c) => c.system_key === k)).filter(Boolean);

/** One flat record per planner task, with cell values keyed by column id. */
export function toRecords(grid) {
  const { rows, columns, cellMap } = grid;
  const status = columns.find((c) => c.system_key === 'status');
  const owner = columns.find((c) => c.system_key === 'owner');
  const due = columns.find((c) => c.system_key === 'due_date');
  return rows.map((r) => {
    const custom_values = {};
    columns.forEach((c) => {
      const v = readCell(cellMap[cellKey(r.id, c.id)], c);
      custom_values[c.id] = LIST_TYPES.includes(c.type) ? v.join(', ') : v;
    });
    return {
      id: r.id, row: r, title: r.title, type: 'task', custom_values,
      owner: owner ? custom_values[owner.id] : '',
      due_date: due ? custom_values[due.id] : '',
      completed: !!status && custom_values[status.id] === COMPLETED,
    };
  });
}

/** Applies the shared view and returns the sections / rowsBySection both views render. */
export function applyPlannerView(grid, records, { search = '', filters = {}, sort = null, groupBy = '' }) {
  const q = search.trim().toLowerCase();
  const applied = Object.entries(filters).filter(([, v]) => !!v);
  const active = !!q || !!groupBy || !!sort?.field || applied.length > 0;

  let list = records.filter((t) => (!q || t.title?.toLowerCase().includes(q))
    && applied.every(([id, v]) => String(t.custom_values[id] ?? '') === v));
  list = sortRows(list, sort, { dueDate: 'due_date' });

  if (!groupBy) {
    const rowsBySection = {};
    list.forEach((t) => { (rowsBySection[t.row.section_id] ||= []).push(t.row); });
    return { active, grouped: false, records: list, sections: grid.sections, rowsBySection };
  }
  const rowsBySection = {};
  list.forEach((t) => { (rowsBySection[t.custom_values[groupBy] || NO_VALUE] ||= []).push(t.row); });
  const sections = Object.keys(rowsBySection).sort((a, b) => (a === NO_VALUE) - (b === NO_VALUE) || a.localeCompare(b)).map((k) => ({ id: k, title: k }));
  return { active, grouped: true, records: list.map((t) => ({ ...t, _group: t.custom_values[groupBy] || NO_VALUE })), sections, rowsBySection };
}