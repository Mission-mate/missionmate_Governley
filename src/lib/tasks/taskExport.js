// PDF / Excel export for task + milestone tables — mirrors the on-screen columns,
// badge colours and owner initials. Column-driven so any task register can reuse it.
import { format, parseISO, isValid } from 'date-fns';
import { exportRegisterPdf } from '@/lib/export/registerPdf';
import { exportRegisterExcel } from '@/lib/export/registerExcel';
import { text, badge, caption, DASH } from '@/lib/export/registerCells';
import { OPTION_COLORS } from '@/lib/registerColors';
import { colId, colLabel, fieldValue } from './taskView';

const fmtDate = (v) => {
  try {
    const d = parseISO(v);
    if (isValid(d)) return format(d, 'd MMM yyyy');
  } catch { /* ignore */ }
  return String(v);
};

const optionClasses = (column, value) => {
  const options = column.kind === 'custom' ? column.config?.options || [] : column.options || [];
  const opt = options.find((o) => (typeof o === 'object' ? o.name : o) === value);
  const c = OPTION_COLORS.find((x) => x.id === opt?.color);
  return c ? `${c.bg} ${c.text}` : 'bg-muted text-muted-foreground';
};

const cellValueText = (column, task) => {
  const v = fieldValue(task, column);
  if (v === '' || v === null || v === undefined) return '';
  if (column.type === 'Date') return fmtDate(v);
  if (column.type === 'Checkbox') return v ? 'Yes' : 'No';
  return String(v);
};

function makeCellFor(columns) {
  return (row, key) => {
    if (key === 'name') {
      const title = row.title || 'Untitled';
      const lines = [[text(title, { size: 8 })]];
      // Neat, text-only meta line: ID · Type · Owner (matches the strategy level PDF style)
      const parts = [];
      if (row.custom_id) parts.push(String(row.custom_id));
      parts.push(row.type === 'milestone' ? 'Milestone' : 'Task');
      if (row.owner) parts.push(String(row.owner));
      const sub = [];
      parts.forEach((p, i) => {
        if (i > 0) sub.push(caption('·'));
        sub.push(caption(p));
      });
      lines.push(sub);
      return lines;
    }
    if (key === '_group') return [[row._group ? text(row._group) : DASH]];
    const column = columns.find((c) => colId(c) === key);
    if (!column) return [[DASH]];
    const value = fieldValue(row, column);
    if (value === '' || value === null || value === undefined) return [[DASH]];
    if (column.type === 'Progress') return [[text(`${Number(value) || 0}%`)]];
    if (column.type === 'People') return [[text(String(value))]];
    if (column.type === 'Single Select' || column.type === 'Multi Select') {
      return [[badge(String(value), optionClasses(column, value))]];
    }
    if (column.type === 'Date') {
      const done = row.completed || row.status === 'Completed' || row.status === 'Cancelled';
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      let overdue = false;
      try {
        const d = parseISO(value);
        overdue = column.key === 'due_date' && !done && isValid(d) && d < today;
      } catch { /* ignore */ }
      return [[text(fmtDate(value), { danger: overdue, bold: overdue })]];
    }
    return [[text(cellValueText(column, row))]];
  };
}

const summaryFor = (rows) => {
  const done = rows.filter((r) => r.completed).length;
  return [
    { value: rows.length, label: 'Tasks & Milestones' },
    { value: done, label: 'Completed' },
    { value: rows.length - done, label: 'Outstanding' },
  ];
};

const hasGroups = (rows) => rows.some((r) => r._group);

export function exportTasksToPdf(rows, columns, title = 'Tasks & Milestones', scopeLabel = 'All Tasks') {
  const grouped = hasGroups(rows);
  // Owner is rendered under the task title (as in the task panel), so it is not a column.
  const pdfCols = columns.filter((c) => colId(c) !== 'owner');
  const pdfColumns = [
    { key: 'name', label: 'Name', width: 300 },
    ...(grouped ? [{ key: '_group', label: 'Group', width: 130 }] : []),
    ...pdfCols.map((c) => ({ key: colId(c), label: colLabel(c), width: 120 })),
  ];
  exportRegisterPdf({
    title,
    statusLabel: scopeLabel,
    summary: summaryFor(rows),
    columns: pdfColumns,
    rows,
    cellFor: makeCellFor(columns),
  });
}

export function exportTasksToExcel(rows, columns, title = 'Tasks & Milestones') {
  const grouped = hasGroups(rows);
  const excelColumns = [
    { label: 'Name', value: (r) => r.title || '' },
    { label: 'ID', value: (r) => r.custom_id || '' },
    { label: 'Type', value: (r) => (r.type === 'milestone' ? 'Milestone' : 'Task') },
    { label: 'Completed', value: (r) => (r.completed ? 'Yes' : 'No') },
    ...(grouped ? [{ label: 'Group', value: (r) => r._group || '' }] : []),
    ...columns.map((c) => ({ label: colLabel(c), value: (r) => cellValueText(c, r) })),
  ];
  exportRegisterExcel({ title, sheetName: 'Tasks', columns: excelColumns, rows });
}