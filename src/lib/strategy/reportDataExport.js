// PDF / Excel export for the Level 6 reporting data table — mirrors the visible
// columns of the on-screen ReportTable (no summary tiles, title + table only).
import { exportRegisterPdf } from '@/lib/export/registerPdf';
import { exportRegisterExcel } from '@/lib/export/registerExcel';
import { text, DASH } from '@/lib/export/registerCells';

/** Stable key for a reporting column (system / optional / custom). */
export const reportColId = (c) => (c.kind === 'custom' ? c.id : `${c.kind}_${c.key}`);

const OPTIONAL_FIELD = {
  ytd: '_ytd',
  expected_ytd: '_expected_ytd',
  progress_pct: '_progress_pct',
  variance_pct: '_variance_pct',
  total_expected: 'total_expected',
};

/** Raw value for a column against a node's display object. */
function rawValue(column, display = {}) {
  if (column.kind === 'system') {
    if (column.key === 'variance') return display._variance;
    return display[column.key];
  }
  if (column.kind === 'optional') return display[OPTIONAL_FIELD[column.key] || column.key];
  return display.custom_values?.[column.id];
}

const isPct = (column) => column.kind === 'optional' && (column.key === 'progress_pct' || column.key === 'variance_pct');

/** Display text for a column value, applying the unit / percentage suffix. */
export function reportCellText(column, display, unit) {
  const v = rawValue(column, display);
  if (v === null || v === undefined || v === '') return '';
  if (typeof v === 'boolean') return v ? 'Yes' : 'No';
  const n = Number(v);
  if (!Number.isNaN(n) && v !== true) {
    if (isPct(column)) return `${n}%`;
    const num = n.toLocaleString();
    if (unit === '$') return `$${num}`;
    if (unit === '%') return `${num}%`;
    return num;
  }
  return String(v);
}

/** Flatten the report tree into export rows, indenting child rows. */
export function flattenReportNodes(nodes) {
  const out = [];
  for (const n of nodes || []) {
    out.push({ _label: n.label || '—', display: n.display || {} });
    for (const c of n.children || []) out.push({ _label: `— ${c.label || '—'}`, display: c.display || {} });
  }
  return out;
}

export function exportReportDataToPdf({ nodes, columns, title, firstColLabel, unit }) {
  const rows = flattenReportNodes(nodes);
  const pdfColumns = [
    { key: 'period', label: firstColLabel, width: 200 },
    ...columns.map((c) => ({ key: reportColId(c), label: c.label, width: 110 })),
  ];
  const cellFor = (row, key) => {
    if (key === 'period') return [[text(row._label, { size: 8 })]];
    const column = columns.find((c) => reportColId(c) === key);
    if (!column) return [[DASH]];
    const value = reportCellText(column, row.display, unit);
    return [[value === '' ? DASH : text(value)]];
  };
  exportRegisterPdf({
    title,
    statusLabel: 'Data Reporting',
    summary: [],
    columns: pdfColumns,
    rows,
    cellFor,
  });
}

export function exportReportDataToExcel({ nodes, columns, title, firstColLabel, unit }) {
  const rows = flattenReportNodes(nodes);
  const excelColumns = [
    { label: firstColLabel, value: (r) => r._label.replace(/^—\s*/, '') },
    ...columns.map((c) => ({ label: c.label, value: (r) => reportCellText(c, r.display, unit) })),
  ];
  exportRegisterExcel({ title, sheetName: 'Data Reporting', columns: excelColumns, rows });
}