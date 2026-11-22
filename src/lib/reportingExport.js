import { jsPDF } from 'jspdf';
import { writeStyledWorkbook } from '@/lib/export/excelWorkbook';
import { format, parseISO } from 'date-fns';
import { isObligationOverdue } from '@/lib/reportingOverdue';

// Destructive/red used for the overdue date in both PDF and Excel.
const OVERDUE_RGB = [220, 53, 69];
const OVERDUE_ARGB = 'FFDC3545';

// ── Value helpers (mirror ReportingObligationsTable rendering) ───────────────

const STATUS_LABELS = {
  not_started: 'Not Started',
  in_progress: 'In Progress',
  complete: 'Completed',
};

function fmtDate(d) {
  if (!d) return '';
  try { return format(parseISO(d), 'd MMM yyyy'); } catch { return String(d); }
}

function statusLabel(s) {
  return STATUS_LABELS[s] || s || '';
}

/** Build an O(1) grant lookup index once per export call. */
function buildGrantMap(grants) {
  return new Map((grants || []).map((g) => [g.id, g]));
}

// opts: { parentField, parentLabel, providerLabel } — defaults describe grant obligations.
const DEFAULT_OPTS = { parentField: 'grant_id', parentLabel: 'Grant Title', providerLabel: 'Grant Provider' };

function grantName(ob, grantMap, opts = DEFAULT_OPTS) {
  return grantMap.get(ob[opts.parentField])?.name || '';
}

function providerName(ob, grantMap, opts = DEFAULT_OPTS) {
  return grantMap.get(ob[opts.parentField])?.provider || '';
}

const columnsFor = (opts) => [
  { id: 'title', label: 'Obligation' },
  { id: 'grant', label: opts.parentLabel },
  { id: 'provider', label: opts.providerLabel },
  { id: 'due_date', label: 'Due Date' },
  { id: 'responsible_person', label: 'Responsible Person' },
  { id: 'status', label: 'Status', kind: 'status' },
];

function cellText(ob, col, grantMap, opts) {
  switch (col.id) {
    case 'title': return ob.title || '';
    case 'grant': return grantName(ob, grantMap, opts);
    case 'provider': return providerName(ob, grantMap, opts);
    case 'due_date': return fmtDate(ob.due_date);
    case 'responsible_person': return ob.responsible_person || '';
    case 'status': return statusLabel(ob.status);
    default: return '';
  }
}

// ── Excel export ─────────────────────────────────────────────────────────────

export function exportObligationsToExcel(obligations, grants, options = {}) {
  const opts = { ...DEFAULT_OPTS, ...options };
  const grantMap = buildGrantMap(grants);
  const rows = obligations.map((o) => {
    const overdue = isObligationOverdue(o);
    return {
      'Obligation': o.title || '',
      'Reporting Type': o.reporting_type || '',
      [opts.parentLabel]: grantName(o, grantMap, opts),
      [opts.providerLabel]: providerName(o, grantMap, opts),
      // The indicator travels inside the date cell so it survives sorting/filtering.
      'Due Date': overdue ? `${fmtDate(o.due_date)}\nOverdue` : fmtDate(o.due_date),
      'Responsible Person': o.responsible_person || '',
      // Lifecycle status is never replaced by "Overdue".
      'Status': statusLabel(o.status),
      __overdue: overdue,
    };
  });

  return writeStyledWorkbook({
    fileName: `reporting-obligations-${format(new Date(), 'yyyy-MM-dd')}.xlsx`,
    sheetName: 'Reporting Obligations',
    headers: [
      'Obligation', 'Reporting Type', opts.parentLabel, opts.providerLabel,
      'Due Date', 'Responsible Person', 'Status',
    ],
    rows: rows.length ? rows : [{ 'Obligation': '' }],
    cellStyle: (row, header) =>
      header === 'Due Date' && row.__overdue ? { color: OVERDUE_ARGB, wrapText: true } : undefined,
  });
}

// ── PDF export (landscape, colored status badge to match UI) ──────────────────

const STATUS_RGB = {
  not_started: { bg: [243, 244, 246], text: [75, 85, 99] },
  in_progress: { bg: [254, 249, 195], text: [161, 98, 7] },
  complete:    { bg: [220, 252, 231], text: [21, 128, 61] },
};

function drawBadge(doc, label, rgb, x, y) {
  const padX = 5;
  const w = doc.getTextWidth(label) + padX * 2;
  const h = 13;
  doc.setFillColor(...rgb.bg);
  doc.roundedRect(x, y - 9, w, h, 3, 3, 'F');
  doc.setTextColor(...rgb.text);
  doc.text(label, x + padX, y);
  doc.setTextColor(0);
  return w;
}

export function exportObligationsToPdf(obligations, grants, meta = {}) {
  const opts = { ...DEFAULT_OPTS, ...(meta.options || {}) };
  const COLUMNS = columnsFor(opts);
  const grantMap = buildGrantMap(grants);
  const doc = new jsPDF({ orientation: 'landscape', unit: 'pt', format: 'a4' });
  const pageW = doc.internal.pageSize.getWidth();
  const pageH = doc.internal.pageSize.getHeight();
  const margin = 32;
  const usableW = pageW - margin * 2;

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(15);
  doc.text('Reporting Obligations', margin, 40);
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9);
  doc.setTextColor(120);
  const metaParts = [
    // fmtDate() only accepts ISO date strings — format the live Date directly
    // so the subtitle never falls back to Date.toString() (which includes time/timezone).
    `Exported ${format(new Date(), 'd MMM yyyy')}`,
    `${obligations.length} obligation${obligations.length !== 1 ? 's' : ''}`,
  ];
  if (meta.scope) metaParts.push(meta.scope);
  doc.text(metaParts.join(' · '), margin, 56);
  doc.setTextColor(0);

  const reqW = Math.min(200, usableW * 0.22);
  const restCount = COLUMNS.length - 1;
  const restW = (usableW - reqW) / restCount;
  const colW = [reqW, ...Array(restCount).fill(restW)];

  let y = 78;
  const lineH = 11;
  const cellPad = 5;

  const drawHeader = () => {
    doc.setFillColor(243, 244, 246);
    doc.rect(margin, y - 12, usableW, 18, 'F');
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(8);
    doc.setTextColor(80);
    let x = margin;
    COLUMNS.forEach((c, i) => {
      doc.text(String(c.label).toUpperCase(), x + cellPad, y, { maxWidth: colW[i] - cellPad * 2 });
      x += colW[i];
    });
    doc.setTextColor(0);
    y += 14;
  };

  drawHeader();
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8.5);

  obligations.forEach((ob) => {
    const cellInfos = COLUMNS.map((col, i) => {
      if (col.kind === 'status') {
        return { kind: 'status', label: statusLabel(ob.status), rgb: STATUS_RGB[ob.status] || STATUS_RGB.not_started, lines: 1 };
      }
      if (col.id === 'due_date') {
        const wrapped = doc.splitTextToSize(fmtDate(ob.due_date), colW[i] - cellPad * 2);
        const overdue = isObligationOverdue(ob);
        // Extra line reserved for the "Overdue" indicator so rows never clip.
        return { kind: 'due', wrapped, overdue, lines: Math.max(1, wrapped.length) + (overdue ? 1 : 0) };
      }
      if (col.id === 'title') {
        const titleWrapped = doc.splitTextToSize(String(ob.title || ''), colW[i] - cellPad * 2);
        const typeWrapped = ob.reporting_type
          ? doc.splitTextToSize(String(ob.reporting_type), colW[i] - cellPad * 2)
          : [];
        return { kind: 'title', titleWrapped, typeWrapped, lines: Math.max(1, titleWrapped.length) + typeWrapped.length };
      }
      const text = cellText(ob, col, grantMap, opts);
      const wrapped = doc.splitTextToSize(String(text || ''), colW[i] - cellPad * 2);
      return { kind: 'text', wrapped, lines: Math.max(1, wrapped.length) };
    });

    const rowLines = Math.max(1, ...cellInfos.map((c) => c.lines));
    const rowH = rowLines * (lineH + 3) + cellPad;

    if (y + rowH > pageH - margin) {
      doc.addPage();
      y = margin + 20;
      drawHeader();
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(8.5);
    }

    let x = margin;
    const textY = y + cellPad + 4;
    cellInfos.forEach((info, i) => {
      if (info.kind === 'status') {
        if (info.label) drawBadge(doc, info.label, info.rgb, x + cellPad, textY);
      } else if (info.kind === 'due') {
        if (info.overdue) doc.setTextColor(...OVERDUE_RGB);
        doc.text(info.wrapped, x + cellPad, textY, { maxWidth: colW[i] - cellPad * 2 });
        if (info.overdue) {
          doc.setFontSize(7.5);
          doc.text('Overdue', x + cellPad, textY + info.wrapped.length * (lineH + 3), { maxWidth: colW[i] - cellPad * 2 });
          doc.setFontSize(8.5);
          doc.setTextColor(0);
        }
      } else if (info.kind === 'title') {
        doc.setFont('helvetica', 'bold');
        doc.text(info.titleWrapped, x + cellPad, textY, { maxWidth: colW[i] - cellPad * 2 });
        doc.setFont('helvetica', 'normal');
        if (info.typeWrapped.length) {
          const typeY = textY + info.titleWrapped.length * (lineH + 3);
          doc.setFontSize(7.5);
          doc.setTextColor(120);
          doc.text(info.typeWrapped, x + cellPad, typeY, { maxWidth: colW[i] - cellPad * 2 });
          doc.setTextColor(0);
          doc.setFontSize(8.5);
        }
      } else {
        doc.text(info.wrapped, x + cellPad, textY, { maxWidth: colW[i] - cellPad * 2 });
      }
      x += colW[i];
    });

    doc.setDrawColor(229, 231, 235);
    doc.line(margin, y + rowH - cellPad, margin + usableW, y + rowH - cellPad);
    y += rowH;
  });

  doc.save(`reporting-obligations-${format(new Date(), 'yyyy-MM-dd')}.pdf`);
}