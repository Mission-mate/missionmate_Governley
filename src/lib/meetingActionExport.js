import { jsPDF } from 'jspdf';
import { writeStyledWorkbook } from '@/lib/export/excelWorkbook';
import { isOverdue, formatDate, meetingMeta } from '@/lib/meetingActionApi';
import { localToday } from '@/lib/localClock';

// Resolve the displayed value of a field for a given action (mirrors the table logic)
function valueForField(action, field) {
  const id = field.id;
  if (id === 'status') {
    return action.status || 'Not Started';
  }
  const topLevel = ['meeting_name', 'meeting_committee', 'meeting_date', 'minute_ref', 'raised_by', 'assigned_to', 'due_date', 'priority'];
  let raw = topLevel.includes(id) ? action[id] : action.custom_fields?.[id];

  if (raw == null || raw === '') return '';

  // Date fields → DD MMM YYYY
  if (field.type === 'Date') return formatDate(raw);

  // Multi Select stored as JSON array
  if (field.type === 'Multi Select') {
    let names = raw;
    if (typeof raw === 'string') { try { names = JSON.parse(raw); } catch { names = [raw]; } }
    return Array.isArray(names) ? names.join(', ') : String(names);
  }

  return String(raw);
}

function buildRows(actions, columns) {
  return actions.map((a) => {
    const row = { 'Action ID': a.action_id || '', 'Action': a.title || 'Untitled action', 'Description': a.description || '' };
    columns.forEach((col) => {
      row[col.label] = valueForField(a, col);
    });
    return row;
  });
}

/** Excel export — uses ALL configured fields (including UI-hidden columns). */
export function exportToExcel(actions, allFields, title) {
  // exclude the meeting-detail fields that are baked into the Action description cell? No —
  // for Excel we include every configured column.
  const columns = allFields;
  const rows = buildRows(actions, columns);
  return writeStyledWorkbook({
    fileName: `${(title || 'meeting-actions').replace(/[^\w-]+/g, '_')}.xlsx`,
    sheetName: 'Actions',
    headers: ['Action ID', 'Action', ...columns.map((c) => c.label)],
    rows,
  });
}

// RGB equivalents of the Tailwind badge palette used in the UI (100 bg / 700 text)
const BADGE_RGB = {
  blue:   { bg: [219, 234, 254], text: [29, 78, 216] },
  orange: { bg: [255, 237, 213], text: [194, 65, 12] },
  red:    { bg: [254, 226, 226], text: [185, 28, 28] },
  green:  { bg: [220, 252, 231], text: [21, 128, 61] },
  purple: { bg: [243, 232, 255], text: [126, 34, 206] },
  gray:   { bg: [243, 244, 246], text: [107, 114, 128] },
};
const STATUS_BADGE = {
  'Not Started': 'blue', 'Active': 'blue', 'Open': 'blue', 'In Progress': 'orange',
  'Completed': 'green', 'On Hold': 'purple', 'Deferred': 'purple', 'Cancelled': 'gray',
};
const PRIORITY_BADGE = {
  'Critical': 'red', 'High': 'orange', 'Medium': 'blue', 'Low': 'green',
};

/** Draws a rounded colored badge with centered-left text, returns nothing. */
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

/** PDF export — landscape, Inter-styled (Helvetica fallback), only UI-visible columns. */
export function exportToPdf(actions, tableColumns, title) {
  const doc = new jsPDF({ orientation: 'landscape', unit: 'pt', format: 'a4' });
  const pageW = doc.internal.pageSize.getWidth();
  const pageH = doc.internal.pageSize.getHeight();
  const margin = 32;

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(15);
  doc.text(title || 'Meeting Action Register', margin, 40);
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9);
  doc.setTextColor(120);
  doc.text(`Exported ${formatDate(localToday())} · ${actions.length} action${actions.length !== 1 ? 's' : ''}`, margin, 56);
  doc.setTextColor(0);

  // Columns: ID, Action, then the visible table columns
  const headers = ['ID', 'Action', ...tableColumns.map((c) => c.label)];
  const rows = actions.map((a) => ({
    action: a,
    cells: [
      a.action_id || '',
      a.title || 'Untitled action',
      ...tableColumns.map((col) => valueForField(a, col)),
    ],
    meta: meetingMeta(a),
  }));

  // Column widths — Action gets the most space, rest share remaining
  const usableW = pageW - margin * 2;
  const idW = 50;
  const actionW = Math.min(220, usableW * 0.3);
  const restCount = headers.length - 2;
  const restW = restCount > 0 ? (usableW - idW - actionW) / restCount : 0;
  const colWidths = [idW, actionW, ...Array(restCount).fill(restW)];

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

  // Map header label → field id so we know which columns render as badges
  const statusIdx = headers.findIndex((h) => h.toUpperCase() === 'STATUS');
  const priorityIdx = headers.findIndex((h) => h.toUpperCase() === 'PRIORITY');

  rows.forEach((row) => {
    // The Action cell (index 1) wraps description + metadata together
    const actionText = row.meta ? `${row.cells[1]}\n${row.meta}` : row.cells[1];
    const wrapped = row.cells.map((cell, i) =>
      doc.splitTextToSize(String(i === 1 ? actionText : (cell || '')), colWidths[i] - cellPad * 2)
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

      // Status / Priority → colored badge
      if (i === statusIdx && STATUS_BADGE[String(row.cells[i])]) {
        drawBadge(doc, String(row.cells[i]), STATUS_BADGE[String(row.cells[i])], x + cellPad, textY);
      } else if (i === priorityIdx && PRIORITY_BADGE[String(row.cells[i])]) {
        drawBadge(doc, String(row.cells[i]), PRIORITY_BADGE[String(row.cells[i])], x + cellPad, textY);
      } else if (i === 1) {
        // Action cell: blue title lines, then grey metadata lines
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
    // Row separator
    doc.setDrawColor(229, 231, 235);
    doc.line(margin, y + rowH - cellPad, margin + usableW, y + rowH - cellPad);
    y += rowH;
  });

  doc.save(`${(title || 'meeting-actions').replace(/[^\w-]+/g, '_')}.pdf`);
}