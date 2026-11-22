import { jsPDF } from 'jspdf';
import { writeStyledWorkbook } from '@/lib/export/excelWorkbook';
import { listNotePages } from '@/lib/notePages';
import { formatDate, isConflictOverdue } from '@/lib/conflictOfInterest';
import { conflictColumnPercents } from '@/lib/conflictColumns';
import { listConflictActionEntries } from '@/lib/conflictActionPage';
import { localToday } from '@/lib/localClock';

const TOP_LEVEL = ['date_of_disclosure', 'committee_notified', 'status', 'conflict_type', 'review_frequency', 'last_review_date', 'next_review_date', 'risk_exposure', 'approved_by'];

function valueForField(c, field) {
  const id = field.id;
  if (id === 'member') return c.member_name || '';
  let raw = TOP_LEVEL.includes(id) ? c[id] : c.custom_fields?.[id];
  if (raw == null || raw === '') return '';
  if (id === 'review_frequency' && raw === 'Every' && c.interval_value) {
    return `Every ${c.interval_value} ${c.interval_unit || 'Months'}`;
  }
  if (field.type === 'Date') return formatDate(raw);
  return String(raw);
}

// Strip HTML tags from rich-text content for plain-text export.
function stripHtml(html) {
  if (!html) return '';
  return String(html)
    .replace(/<\/(p|div|li|h[1-6])>/gi, '\n')
    .replace(/<br\s*\/?>/gi, '\n')
    .replace(/<[^>]+>/g, '')
    .replace(/&nbsp;/gi, ' ')
    .replace(/&amp;/gi, '&')
    .replace(/&lt;/gi, '<')
    .replace(/&gt;/gi, '>')
    .replace(/\n{3,}/g, '\n\n')
    .trim();
}

export async function exportToExcel(conflicts, columns, title, personLabel = 'Member') {
  // Fetch all notes and actions for the conflicts being exported.
  const ids = conflicts.map((c) => c.id);
  const [allNotes, allActions] = await Promise.all([
    Promise.all(ids.map((id) => listNotePages('conflict_of_interest', id))),
    Promise.all(ids.map((id) => listConflictActionEntries(id))),
  ]);

  const notesByConflict = {};
  const actionsByConflict = {};
  ids.forEach((id, i) => {
    notesByConflict[id] = (allNotes[i] || []).sort((a, b) => new Date(a.created_date) - new Date(b.created_date));
    actionsByConflict[id] = (allActions[i] || []).sort((a, b) => new Date(a.created_date) - new Date(b.created_date));
  });

  const formatEntry = (e) => {
    const heading = e.title ? `${e.title}: ` : '';
    return `${heading}${stripHtml(e.content)}`.trim();
  };

  const rows = conflicts.map((c) => {
    const row = { 'Conflict ID': c.conflict_id || '', [personLabel]: c.member_name || '' };
    if (conflicts.some((x) => x.title)) row['Declaration Title'] = c.title || '';
    columns.forEach((col) => { if (col.id !== 'member') row[col.label] = valueForField(c, col); });
    row['Description'] = c.description || '';

    // Each note/action in its own column: "Note 1", "Note 2", "Action 1", ...
    (notesByConflict[c.id] || []).forEach((n, i) => { row[`Note ${i + 1}`] = formatEntry(n); });
    (actionsByConflict[c.id] || []).forEach((a, i) => { row[`Action ${i + 1}`] = formatEntry(a); });
    return row;
  });

  // Build a unified header set so every row aligns to the same columns.
  const allKeys = [];
  rows.forEach((r) => Object.keys(r).forEach((k) => { if (!allKeys.includes(k)) allKeys.push(k); }));

  return writeStyledWorkbook({
    fileName: `${(title || 'conflict-of-interest').replace(/[^\w-]+/g, '_')}.xlsx`,
    sheetName: 'Conflicts',
    headers: allKeys,
    rows,
  });
}

const BADGE_RGB = {
  blue: { bg: [219, 234, 254], text: [29, 78, 216] },
  orange: { bg: [255, 237, 213], text: [194, 65, 12] },
  red: { bg: [254, 226, 226], text: [185, 28, 28] },
  green: { bg: [220, 252, 231], text: [21, 128, 61] },
  purple: { bg: [243, 232, 255], text: [126, 34, 206] },
  gray: { bg: [243, 244, 246], text: [107, 114, 128] },
};
const RISK_BADGE = { High: 'red', Medium: 'orange', Low: 'green' };
const STATUS_BADGE = { Open: 'blue', Closed: 'green' };

function drawBadge(doc, label, colorKey, x, y) {
  const c = BADGE_RGB[colorKey] || BADGE_RGB.gray;
  const padX = 5;
  const w = doc.getTextWidth(label) + padX * 2;
  doc.setFillColor(...c.bg);
  doc.roundedRect(x, y - 9, w, 13, 3, 3, 'F');
  doc.setTextColor(...c.text);
  doc.text(label, x + padX, y);
  doc.setTextColor(0);
}

// The "Details" column mirrors the table cell: member name, then ID + date, then description.
function detailsLines(doc, c, width) {
  const lines = [];
  const name = c.member_name || 'Unassigned';
  const meta = [`ID: ${c.conflict_id || '—'}`, c.date_of_disclosure ? formatDate(c.date_of_disclosure) : '']
    .filter(Boolean).join('  ·  ');
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8.5);
  doc.splitTextToSize(name, width).forEach((l) => lines.push({ text: l, bold: true, color: 0 }));
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8);
  if (c.title) doc.splitTextToSize(c.title, width).forEach((l) => lines.push({ text: l, bold: false, color: 40 }));
  if (meta) doc.splitTextToSize(meta, width).forEach((l) => lines.push({ text: l, bold: false, color: 130 }));
  if (c.description) {
    const descLines = doc.splitTextToSize(c.description, width);
    if (c.register_id) {
      // Compliance register: one-row preview, ellipsised when longer.
      let first = descLines[0];
      if (descLines.length > 1) {
        while (first && doc.getTextWidth(`${first}…`) > width) first = first.slice(0, -1);
        first = `${first.trimEnd()}…`;
      }
      lines.push({ text: first, bold: false, color: 90 });
    } else {
      descLines.forEach((l) => lines.push({ text: l, bold: false, color: 90 }));
    }
  }
  return lines;
}

export function exportToPdf(conflicts, columns, title) {
  const doc = new jsPDF({ orientation: 'landscape', unit: 'pt', format: 'a4' });
  const pageW = doc.internal.pageSize.getWidth();
  const pageH = doc.internal.pageSize.getHeight();
  const margin = 32;

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(15);
  doc.text(title || 'Conflict of Interest Register', margin, 40);
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9);
  doc.setTextColor(120);
  doc.text(`Exported ${formatDate(localToday())} · ${conflicts.length} conflict${conflicts.length !== 1 ? 's' : ''}`, margin, 56);
  doc.setTextColor(0);

  // Columns mirror the register table: Details (name + ID + date), then the configured columns.
  const dataCols = columns.filter((c) => c.id !== 'member');
  const headers = ['Details', ...dataCols.map((c) => c.label)];

  const usableW = pageW - margin * 2;
  // Same proportional split as the on-screen table.
  const pct = conflictColumnPercents(['details', ...dataCols.map((c) => c.id)]);
  const detailsW = usableW * pct.details / 100;
  const colWidths = [detailsW, ...dataCols.map((c) => usableW * pct[c.id] / 100)];

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
    headers.forEach((h, i) => { doc.text(String(h).toUpperCase(), x + cellPad, y, { maxWidth: colWidths[i] - cellPad * 2 }); x += colWidths[i]; });
    doc.setTextColor(0);
    y += 14;
  };

  drawHeader();

  conflicts.forEach((c) => {
    // Build wrapped content for each column.
    const details = detailsLines(doc, c, detailsW - cellPad * 2);
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8.5);
    const overdue = isConflictOverdue(c);
    const restLines = dataCols.map((col, i) => {
      const lines = doc.splitTextToSize(String(valueForField(c, col) || ''), colWidths[i + 1] - cellPad * 2);
      // Overdue next review dates get an extra "Overdue" sub-line, as in the table.
      if (col.id === 'next_review_date' && overdue && c.next_review_date) lines.push('Overdue');
      return lines;
    });

    const rowLines = Math.max(1, details.length, ...restLines.map((w) => w.length));
    const rowH = rowLines * lineH + cellPad * 2;
    if (y + rowH > pageH - margin) { doc.addPage(); y = margin + 20; drawHeader(); }

    const topY = y + cellPad + 4;
    let x = margin;

    // Details (styled multi-line)
    let dLy = topY;
    details.forEach((ln) => {
      doc.setFont('helvetica', ln.bold ? 'bold' : 'normal');
      doc.setFontSize(ln.bold ? 8.5 : 8);
      doc.setTextColor(ln.color);
      doc.text(ln.text, x + cellPad, dLy);
      dLy += lineH;
    });
    doc.setTextColor(0);
    x += detailsW;

    // Remaining columns
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8.5);
    restLines.forEach((lines, i) => {
      const colW = colWidths[i + 1];
      const colId = dataCols[i].id;
      const val = String(valueForField(c, dataCols[i]) || '');
      if (colId === 'status' && STATUS_BADGE[val]) {
        drawBadge(doc, val, STATUS_BADGE[val], x + cellPad, topY);
      } else if (colId === 'risk_exposure' && RISK_BADGE[val]) {
        drawBadge(doc, val, RISK_BADGE[val], x + cellPad, topY);
      } else if (colId === 'next_review_date' && overdue && val) {
        // Red date plus a red "Overdue" sub-line, mirroring the table cell.
        doc.setTextColor(185, 28, 28);
        let ly = topY;
        lines.forEach((ln, li) => {
          doc.setFontSize(li === lines.length - 1 ? 7.5 : 8.5);
          doc.text(ln, x + cellPad, ly, { maxWidth: colW - cellPad * 2 });
          ly += lineH;
        });
        doc.setFontSize(8.5);
        doc.setTextColor(0);
      } else {
        doc.setTextColor(60);
        doc.text(lines, x + cellPad, topY, { maxWidth: colW - cellPad * 2 });
        doc.setTextColor(0);
      }
      x += colW;
    });

    doc.setDrawColor(229, 231, 235);
    doc.line(margin, y + rowH - cellPad, margin + usableW, y + rowH - cellPad);
    y += rowH;
  });

  doc.save(`${(title || 'conflict-of-interest').replace(/[^\w-]+/g, '_')}.pdf`);
}