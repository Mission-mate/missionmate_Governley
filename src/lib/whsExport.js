// Excel / PDF export for WHS register tabs, mirroring the on-screen table columns and cells.
import { base44 } from '@/api/base44Client';
import { exportRegisterExcel } from '@/lib/export/registerExcel';
import { exportRegisterPdf } from '@/lib/export/registerPdf';
import { text, badge, person, caption, stripHtml, DASH } from '@/lib/export/registerCells';
import { formatReviewDate } from '@/lib/reviewDateUtils';
import { localToday } from '@/lib/localClock';
import { STATUS_PILL, columnWidth } from '@/lib/whsTabs';
import { RATING_STYLES } from '@/lib/riskMatrix';
import { SOURCE_TYPES } from '@/lib/whsRegister';
import { OPTION_COLORS } from '@/lib/registerColors';

const MUTED = 'bg-muted text-muted-foreground';
const optionClasses = (options, v) => {
  const c = OPTION_COLORS.find((x) => x.id === (options || []).find((o) => o.name === v)?.color);
  return c ? `${c.bg} ${c.text}` : MUTED;
};

const rawValue = (col, row) => (col.kind === 'custom' ? row.custom_fields?.[col.column.id] : row[col.key]);

/** Plain-text value of a column (Excel and PDF fallbacks). */
const display = (col, row) => {
  const v = rawValue(col, row);
  if (v == null || v === '') return '';
  if (Array.isArray(v)) return v.join(', ');
  if (typeof v === 'boolean') return v ? 'Yes' : 'No';
  if (col.kind === 'date' || (col.kind === 'custom' && col.column.type === 'date')) return formatReviewDate(v);
  if (col.kind === 'source') return SOURCE_TYPES[v]?.label || v;
  return stripHtml(String(v));
};

const isOverdue = (col, row) => col.overdue && !['Completed', 'Closed'].includes(row.status) && row[col.key] < localToday();

/** PDF cell descriptor mirroring WhsCell. */
function pdfCell(col, row) {
  if (col.kind === 'title') {
    const lines = [[text(row[col.key] || '—', { bold: true })]];
    const sub = stripHtml(row[col.sub]);
    if (sub) lines.push([text(sub, { muted: true, size: 6.8 })]);
    (col.meta || []).forEach((m) => {
      const v = row[m.key];
      lines.push([caption(`${m.label}:`), v ? (m.avatar ? person(v) : text(v, { size: 6.8 })) : text('—', { muted: true, size: 6.8 })]);
    });
    return lines;
  }
  if (col.kind === 'rating') {
    const v = row[col.key];
    if (!v) return [[text('Not assessed', { muted: true })]];
    const s = RATING_STYLES[v];
    return [[badge(v, s ? `${s.bg} ${s.text}` : MUTED)]];
  }
  const v = display(col, row);
  if (!v) return [[DASH]];
  if (col.kind === 'source') {
    const lines = [[text(v, { bold: true })]];
    if (row.source_code) lines.push([text(row.source_code, { muted: true, size: 6.8 })]);
    return lines;
  }
  if (col.kind === 'code') return [[text(v, { muted: true })]];
  if (col.kind === 'date' && isOverdue(col, row)) {
    return [[text(v, { danger: true, bold: true })], [text('Overdue', { danger: true, size: 6.5 })]];
  }
  if (col.kind === 'person') return [[person(v)]];
  if (col.kind === 'pill') return [[badge(v, STATUS_PILL[v] || MUTED)]];
  if (col.kind === 'label') return [[badge(v, optionClasses(col.options, v))]];
  if (col.kind === 'custom') {
    const options = col.column.config?.options;
    const raw = rawValue(col, row);
    if (options?.length) return [(Array.isArray(raw) ? raw : [raw]).map((o) => badge(o, optionClasses(options, o)))];
  }
  return [[text(v)]];
}

/** Every record matching the current query (cursor loop — export only). */
async function fetchAll(cfg, query, sort) {
  const out = [];
  let cursor;
  do {
    const page = await base44.entities[cfg.entity].filter(query, { sort, limit: 500, ...(cursor ? { cursor } : {}) });
    out.push(...page.items);
    cursor = page.has_more ? page.next_cursor : null;
  } while (cursor);
  return out;
}

export async function exportWhs(format, { cfg, columns, registerTitle, statusLabel, query, sort, selected }) {
  const rows = selected?.length ? selected : await fetchAll(cfg, query, sort);
  const title = `${registerTitle} - ${cfg.label}`;
  if (format === 'excel') {
    const excelCols = columns.flatMap((c) => [
      { label: c.label, value: (r) => display(c, r) },
      ...(c.sub ? [{ label: 'Description', value: (r) => stripHtml(r[c.sub]) }] : []),
      ...(c.meta || []).map((m) => ({ label: m.label, value: (r) => r[m.key] || '' })),
    ]);
    return exportRegisterExcel({ title, sheetName: cfg.label, columns: excelCols, rows });
  }
  const byKey = Object.fromEntries(columns.map((c) => [c.key, c]));
  return exportRegisterPdf({
    title, statusLabel, rows,
    summary: [{ label: `Total ${cfg.label}`, value: rows.length }],
    columns: columns.map((c) => ({ key: c.key, label: c.label, width: c.kind === 'title' ? 340 : columnWidth(c) })),
    cellFor: (row, key) => pdfCell(byKey[key], row),
  });
}