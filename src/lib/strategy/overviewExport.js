import { jsPDF } from 'jspdf';
import { writeStyledWorkbook } from '@/lib/export/excelWorkbook';

const BASE_HEADERS = ['ID', 'Strategic Item Level', 'Strategic Item Title', 'Owner', 'Health', 'Status'];

const headersFor = (showPriority) => (showPriority ? [...BASE_HEADERS, 'Priority'] : BASE_HEADERS);

const cellsFor = (item, showPriority) => [
  item.custom_id || '',
  item.levelLabel || '',
  item.title || '',
  item.owner || '',
  item.health || '',
  item.status || '',
  ...(showPriority ? [item.priority || ''] : []),
];

const fileBase = (title) => `${(title || 'strategy-overview').replace(/[^\w-]+/g, '_')}`;

/** Excel — flat table, one row per visible block, tree order preserved. */
export function exportOverviewExcel(items, title, { showPriority = true } = {}) {
  const headers = headersFor(showPriority);
  const rows = items.map((item) => {
    const cells = cellsFor(item, showPriority);
    const row = {};
    headers.forEach((h, i) => { row[h] = cells[i]; });
    return row;
  });
  return writeStyledWorkbook({
    fileName: `${fileBase(title)}.xlsx`,
    sheetName: 'Strategy Overview',
    headers,
    rows,
    widths: headers.map((h) => Math.max(h.length + 2, 18)),
  });
}

const BADGE_RGB = {
  blue: { bg: [219, 234, 254], text: [29, 78, 216] },
  orange: { bg: [255, 237, 213], text: [194, 65, 12] },
  red: { bg: [254, 226, 226], text: [185, 28, 28] },
  green: { bg: [220, 252, 231], text: [21, 128, 61] },
  purple: { bg: [243, 232, 255], text: [126, 34, 206] },
  amber: { bg: [254, 243, 199], text: [180, 83, 9] },
  gray: { bg: [243, 244, 246], text: [113, 118, 128] },
};
// Mirrors STATUS_STYLES / PRIORITY_STYLES used by the table UI.
const STATUS_BADGE = { 'Not Started': 'gray', 'In Progress': 'blue', Completed: 'green', 'On Hold': 'amber', Cancelled: 'red' };
const PRIORITY_BADGE = { High: 'red', Medium: 'amber', Low: 'green' };
const HEALTH_TEXT = { 'On Track': [21, 128, 61], 'At Risk': [180, 83, 9], Monitor: [180, 83, 9], 'Off Track': [185, 28, 28] };

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

/**
 * PDF — landscape table mirroring the Overview tree (indentation, badges, level labels).
 * `extraHeaders` appends custom columns; each item supplies matching `extras` values.
 */
export function exportOverviewPdf(items, title, extraHeaders = [], { showPriority = true } = {}) {
  const doc = new jsPDF({ orientation: 'landscape', unit: 'pt', format: 'a4' });
  const pageW = doc.internal.pageSize.getWidth();
  const pageH = doc.internal.pageSize.getHeight();
  const margin = 32;
  const usableW = pageW - margin * 2;

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(15);
  doc.text(title || 'Strategy Overview', margin, 40);
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9);
  doc.setTextColor(120);
  doc.text(`Exported ${new Date().toLocaleDateString()} · ${items.length} item${items.length !== 1 ? 's' : ''}`, margin, 56);
  doc.setTextColor(0);

  // PDF mirrors the table UI: a single Strategic Item column with the ID, level and owner
  // stacked under the title, then Health / Status / Priority.
  const PDF_HEADERS = ['Strategic Item', 'Health', 'Status', ...(showPriority ? ['Priority'] : []), ...extraHeaders];
  const tailCount = PDF_HEADERS.length - 1;
  const itemW = usableW * (extraHeaders.length ? 0.4 : 0.55);
  const rest = (usableW - itemW) / tailCount;
  const colWidths = [itemW, ...Array(tailCount).fill(rest)];

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
    PDF_HEADERS.forEach((h, i) => {
      doc.text(h.toUpperCase(), x + cellPad, y, { maxWidth: colWidths[i] - cellPad * 2 });
      x += colWidths[i];
    });
    doc.setTextColor(0);
    y += 14;
  };

  drawHeader();
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8.5);

  items.forEach((item) => {
    const indent = (item.depth || 0) * 12;
    const titleW = colWidths[0] - cellPad * 2 - indent;

    // Measure with the exact font/size each block is drawn in — measuring in a lighter
    // weight than we render is what let long titles bleed into the Health column.
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8.5);
    const titleLines = doc.splitTextToSize(String(item.title || ''), titleW);
    const metaText = [item.custom_id, item.levelLabel, item.owner].filter(Boolean).join('  ·  ');
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(7.5);
    const metaLines = metaText ? doc.splitTextToSize(metaText, titleW) : [];
    const rowH = (titleLines.length + metaLines.length) * lineH + cellPad * 2;

    if (y + rowH > pageH - margin) {
      doc.addPage();
      y = margin + 20;
      drawHeader();
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(8.5);
    }

    const textY = y + cellPad + 4;

    // Strategic Item — title, then ID / level / owner beneath it
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8.5);
    doc.text(titleLines, margin + cellPad + indent, textY, { maxWidth: titleW });
    if (metaLines.length) {
      doc.setFontSize(7.5);
      doc.setTextColor(120);
      doc.text(metaLines, margin + cellPad + indent, textY + titleLines.length * lineH, { maxWidth: titleW });
      doc.setTextColor(0);
      doc.setFontSize(8.5);
    }

    // Health / Status / Priority
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8.5);
    let x = margin + colWidths[0];
    const tailCells = [
      { kind: 'health', raw: item.health },
      { kind: 'status', raw: item.status },
      ...(showPriority ? [{ kind: 'priority', raw: item.priority }] : []),
      ...(item.extras || []).map((raw) => ({ kind: 'extra', raw })),
    ];
    tailCells.forEach(({ kind, raw }, i) => {
      const value = String(raw || '');
      if (kind === 'health' && HEALTH_TEXT[value]) {
        doc.setFont('helvetica', 'bold');
        doc.setTextColor(...HEALTH_TEXT[value]);
        doc.text(value, x + cellPad, textY);
        doc.setTextColor(0);
        doc.setFont('helvetica', 'normal');
      } else if (kind === 'status' && STATUS_BADGE[value]) {
        drawBadge(doc, value, STATUS_BADGE[value], x + cellPad, textY);
      } else if (kind === 'priority' && PRIORITY_BADGE[value]) {
        drawBadge(doc, value, PRIORITY_BADGE[value], x + cellPad, textY);
      } else if (value) {
        doc.text(doc.splitTextToSize(value, colWidths[i + 1] - cellPad * 2), x + cellPad, textY);
      }
      x += colWidths[i + 1];
    });

    doc.setDrawColor(229, 231, 235);
    doc.line(margin, y + rowH - cellPad, margin + usableW, y + rowH - cellPad);
    y += rowH;
  });

  doc.save(`${fileBase(title)}.pdf`);
}