// Shared filter / sort / group logic for task + milestone tables.
// Column-driven so it works for any task register (per-initiative or a future master register).
import { sortRows } from '@/lib/registerSort';

const byOrder = (a, b) => (a.order_index ?? 0) - (b.order_index ?? 0);

/** Column types that make sense to group / filter by. */
const DISCRETE_TYPES = ['Single Select', 'Multi Select', 'People'];

export const colId = (c) => (c.kind === 'custom' ? c.id : c.key);
export const colLabel = (c) => c.label || c.title || '';

/** Columns eligible for Group / Filter menus. */
export const discreteColumns = (columns = []) => columns.filter((c) => DISCRETE_TYPES.includes(c.type));

export function fieldValue(task, column) {
  if (!column) return '';
  return (column.kind === 'custom' ? task.custom_values?.[column.id] : task[column.key]) ?? '';
}

/** Distinct values present for a column, sorted. */
export function valuesFor(tasks, column) {
  const set = new Set();
  tasks.forEach((t) => {
    const v = fieldValue(t, column);
    if (v) set.add(String(v));
  });
  return [...set].sort();
}

/**
 * Apply the active view to the top-level tasks / milestones.
 * Returns { active, rows, groups } — groups is null unless grouping is on.
 */
export function buildTaskView(tasks = [], columns = [], view = {}) {
  const { filters = {}, sort = null, groupBy = '' } = view;
  const appliedFilters = Object.entries(filters).filter(([, v]) => !!v);
  const active = !!groupBy || !!sort?.field || appliedFilters.length > 0;

  let rows = tasks.filter((t) => t.type !== 'section');

  appliedFilters.forEach(([id, value]) => {
    const col = columns.find((c) => colId(c) === id);
    if (!col) return;
    rows = rows.filter((t) => String(fieldValue(t, col)) === String(value));
  });

  rows = sort?.field ? sortRows(rows, sort, { dueDate: 'due_date' }) : [...rows].sort(byOrder);

  let groups = null;
  if (groupBy) {
    const col = columns.find((c) => colId(c) === groupBy);
    const map = new Map();
    rows.forEach((t) => {
      const label = String(fieldValue(t, col) || 'Not set');
      if (!map.has(label)) map.set(label, []);
      map.get(label).push(t);
    });
    groups = [...map.entries()].map(([label, groupRows]) => ({ label, rows: groupRows }));
  }

  return { active, rows, groups };
}

/**
 * Flatten the current view into display order for exporting.
 * When no view is active, rows follow the section grouping shown in the table.
 */
export function flattenTaskRows(result, tasks = []) {
  const out = [];
  const push = (t, group) => { out.push({ ...t, _group: group }); };

  if (result.groups) {
    result.groups.forEach((g) => g.rows.forEach((t) => push(t, g.label)));
    return out;
  }
  if (result.active) {
    result.rows.forEach((t) => push(t, ''));
    return out;
  }

  const sections = tasks.filter((t) => t.type === 'section').sort(byOrder);
  result.rows.filter((t) => !t.section_id).forEach((t) => push(t, ''));
  sections.forEach((sec) => {
    result.rows
      .filter((t) => t.section_id === sec.id)
      .forEach((t) => push(t, sec.title || 'Untitled section'));
  });
  return out;
}