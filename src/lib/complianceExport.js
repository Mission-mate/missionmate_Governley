import { jsPDF } from 'jspdf';
import { writeStyledWorkbook } from '@/lib/export/excelWorkbook';
import { formatDate } from '@/lib/complianceApi';
import { localToday } from '@/lib/localClock';

// Top-level obligation fields (everything else lives in custom_fields)
const TOP_LEVEL = ['category', 'regulator', 'frequency', 'owner', 'due_date', 'priority', 'status'];

// Resolve the displayed value of a field for a given obligation
function valueForField(obligation, field) {
  const id = field.id;
  if (id === 'status') return obligation.status || 'Not Started';

  let raw = TOP_LEVEL.includes(id) ? obligation[id] : obligation.custom_fields?.[id];
  if (raw == null || raw === '') return '';

  if (field.type === 'Date') return formatDate(raw);

  if (field.type === 'Multi Select') {
    let names = raw;
    if (typeof raw === 'string') { try { names = JSON.parse(raw); } catch { names = [raw]; } }
    return Array.isArray(names) ? names.join(', ') : String(names);
  }

  return String(raw);
}

function buildRows(obligations, columns) {
  return obligations.map((o) => {
    const row = { 'ID': o.obligation_id || '', 'Obligation': o.title || '' };
    columns.forEach((col) => {
      row[col.label] = valueForField(o, col);
    });
    return row;
  });
}

/** Excel export — uses ALL configured fields. */
export function exportToExcel(obligations, allFields, title) {
  const columns = allFields;
  const rows = buildRows(obligations, columns);
  return writeStyledWorkbook({
    fileName: `${(title || 'compliance-obligations').replace(/[^\w-]+/g, '_')}.xlsx`,
    sheetName: 'Obligations',
    headers: ['ID', 'Obligation', ...columns.map((c) => c.label)],
    rows,
  });
}

const BADGE_RGB = {
  blue:   { bg: [219, 234, 254], text: [29, 78, 216] },
  orange: { bg: [255, 237, 213], text: [194, 65, 12] },
  red:    { bg: [254, 226, 226], text: [185, 28, 28] },
  green:  { bg: [220, 252, 231], text: [21, 128, 61] },
  purple: { bg: [243, 232, 255], text: [126, 34, 206] },
  gray:   { bg: [243, 244, 246], text: [107, 114, 128] },
};
const STATUS_BADGE = {
  'Not Started': 'blue', 'In Progress': 'orange', 'Completed': 'green', 'On Hold': 'purple', 'Cancelled': 'gray',
};
const PRIORITY_BADGE = { 'High': 'red', 'Medium': 'orange', 'Low': 'green' };

function drawBadge(doc, label, colorKey, x, y) {
  const c = BADGE_RGB[colorKey] || BADGE_RGB.gray;
  const padX = 5;
  const w = doc.getTextWidth(label) + padX * 2;
  const h = 13;
  doc.setFillColor(...c.bg);
  doc.roundedRect(x, y - 9, w, h, 3, 3, 'F');
  doc.setTextColor(...c.text);
  doc.text(label, x + padX, y);
  doc.setTextColor(0);
}

/** PDF export — landscape, Helvetica. */
export function exportToPdf(obligations, tableColumns, title) {
  const doc = new jsPDF({ orientation: 'landscape', unit: 'pt', format: 'a4' });
  const pageW = doc.internal.pageSize.getWidth();
  const pageH = doc.internal.pageSize.getHeight();
  const margin = 32;

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(15);
  doc.text(title || 'Compliance Register', margin, 40);
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9);
  doc.setTextColor(120);
  doc.text(`Exported ${formatDate(localToday())} · ${obligations.length} obligation${obligations.length !== 1 ? 's' : ''}`, margin, 56);
  doc.setTextColor(0);

  const headers = ['ID', 'Obligation', ...tableColumns.map((c) => c.label)];
  const rows = obligations.map((o) => ({
    cells: [
      o.obligation_id || '',
      o.title || '',
      ...tableColumns.map((col) => valueForField(o, col)),
    ],
    meta: [o.category, o.regulator].filter(Boolean).join(' · '),
  }));

  const usableW = pageW - margin * 2;
  const idW = 50;
  const obligationW = Math.min(220, usableW * 0.3);
  const restCount = headers.length - 2;
  const restW = restCount > 0 ? (usableW - idW - obligationW) / restCount : 0;
  const colWidths = [idW, obligationW, ...Array(restCount).fill(restW)];

  let y = 78;
  const lineH = 11;
  const cellPad = 4;

  const drawHeader = () => {
    doc.setFillColor(243, 244, 246);
    doc.rect(margin, y - 12, usableW, 18, 'F');
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(8);
    doc.setTextColor(80);
    let x = margin;
    headers.forEach((h, i) => {
      doc.text(String(h).toUpperCase(), x + cellPad, y, { maxWidth: colWidths[i] - cellPad * 2 });
      x += colWidths[i];
    });
    doc.setTextColor(0);
    y += 14;
  };

  drawHeader();
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8.5);

  const statusIdx = headers.findIndex((h) => h.toUpperCase() === 'STATUS');
  const priorityIdx = headers.findIndex((h) => h.toUpperCase() === 'PRIORITY');

  rows.forEach((row) => {
    const obligationText = row.meta ? `${row.cells[1]}\n${row.meta}` : row.cells[1];
    const wrapped = row.cells.map((cell, i) =>
      doc.splitTextToSize(String(i === 1 ? obligationText : (cell || '')), colWidths[i] - cellPad * 2)
    );
    const rowLines = Math.max(1, ...wrapped.map((w) => w.length));
    const rowH = rowLines * lineH + cellPad * 2;

    if (y + rowH > pageH - margin) {
      doc.addPage();
      y = margin + 20;
      drawHeader();
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(8.5);
    }

    let x = margin;
    wrapped.forEach((lines, i) => {
      const textY = y + cellPad + 4;
      if (i === statusIdx && STATUS_BADGE[String(row.cells[i])]) {
        drawBadge(doc, String(row.cells[i]), STATUS_BADGE[String(row.cells[i])], x + cellPad, textY);
      } else if (i === priorityIdx && PRIORITY_BADGE[String(row.cells[i])]) {
        drawBadge(doc, String(row.cells[i]), PRIORITY_BADGE[String(row.cells[i])], x + cellPad, textY);
      } else if (i === 1) {
        const descLines = doc.splitTextToSize(String(row.cells[1] || ''), colWidths[i] - cellPad * 2);
        doc.setTextColor(29, 78, 216);
        doc.text(descLines, x + cellPad, textY, { maxWidth: colWidths[i] - cellPad * 2 });
        if (row.meta) {
          const metaLines = doc.splitTextToSize(row.meta, colWidths[i] - cellPad * 2);
          doc.setTextColor(120);
          doc.text(metaLines, x + cellPad, textY + descLines.length * lineH, { maxWidth: colWidths[i] - cellPad * 2 });
        }
        doc.setTextColor(0);
      } else {
        doc.text(lines, x + cellPad, textY, { maxWidth: colWidths[i] - cellPad * 2 });
      }
      x += colWidths[i];
    });
    doc.setDrawColor(229, 231, 235);
    doc.line(margin, y + rowH - cellPad, margin + usableW, y + rowH - cellPad);
    y += rowH;
  });

  doc.save(`${(title || 'compliance-obligations').replace(/[^\w-]+/g, '_')}.pdf`);
}