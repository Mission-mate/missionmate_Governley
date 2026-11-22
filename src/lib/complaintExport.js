import { jsPDF } from 'jspdf';
import { writeStyledWorkbook } from '@/lib/export/excelWorkbook';
import { formatReviewDate } from '@/lib/complianceRegisters';
import { STATUS_OPTIONS, SEVERITY_OPTIONS, CORRECTIVE_ACTION_OPTIONS } from '@/lib/complaintRegister';
import { customValueText } from '@/lib/strategy/levelFields';
import { localToday } from '@/lib/localClock';

const customCols = (columns) => columns.map((col) => [col.title, (c) => customValueText(col, c.custom_fields?.[col.id])]);

const d = (v) => (v ? formatReviewDate(v) : '');
const fileBase = (title) => (title || 'complaints-register').replace(/[^\w-]+/g, '_');

const EXCEL_COLS = [
  ['Complaint ID', (c) => c.complaint_code], ['Complaint Date', (c) => d(c.complaint_date)],
  ['Complainant Name', (c) => c.complainant_name], ['Complainant Email', (c) => c.complainant_email],
  ['Complainant Phone', (c) => c.complainant_phone], ['Status', (c) => c.status], ['Severity', (c) => c.severity],
  ['Taken By', (c) => c.taken_by], ['Channel', (c) => c.channel], ['Complaint Description', (c) => c.details],
  ['Root Cause Analysis', (c) => c.root_cause], ['Corrective Action', (c) => c.corrective_action], ['Action Status', (c) => c.action_status],
  ['Corrective Action Details', (c) => c.corrective_action_details],
  ['Date Resolved', (c) => d(c.date_resolved)], ['Resolved By', (c) => c.resolved_by],
];

export function exportComplaintsToExcel(items, title, customColumns = []) {
  const cols = [...EXCEL_COLS, ...customCols(customColumns)];
  return writeStyledWorkbook({
    fileName: `${fileBase(title)}.xlsx`,
    sheetName: 'Complaints',
    headers: cols.map(([h]) => h),
    rows: items.map((c) => Object.fromEntries(cols.map(([h, f]) => [h, f(c) || '']))),
  });
}

const RGB = {
  green: { bg: [220, 252, 231], text: [21, 128, 61] }, orange: { bg: [255, 237, 213], text: [194, 65, 12] },
  red: { bg: [254, 226, 226], text: [185, 28, 28] }, gray: { bg: [243, 244, 246], text: [75, 85, 99] }, blue: { bg: [219, 234, 254], text: [29, 78, 216] },
};
// Mirrors the Complaints Register table columns and order.
const HEADERS = ['Details', 'Status', 'Severity', 'Taken By', 'Corrective Action'];
const RATIOS = [0.42, 0.1, 0.1, 0.18, 0.2];
const BADGES = { 1: STATUS_OPTIONS, 2: SEVERITY_OPTIONS, 4: CORRECTIVE_ACTION_OPTIONS };

export function exportComplaintsToPdf(items, title, customColumns = []) {
  const extra = customCols(customColumns);
  const headers = [...HEADERS, ...extra.map(([h]) => h)];
  const raw = [...RATIOS, ...extra.map(() => 0.1)];
  const total = raw.reduce((a, b) => a + b, 0);
  const doc = new jsPDF({ orientation: 'landscape', unit: 'pt', format: 'a4' });
  const pageW = doc.internal.pageSize.getWidth();
  const pageH = doc.internal.pageSize.getHeight();
  const margin = 32; const usableW = pageW - margin * 2;
  const widths = raw.map((r) => (r / total) * usableW);
  const pad = 5; const lineH = 11;

  doc.setFont('helvetica', 'bold'); doc.setFontSize(15);
  doc.text(title || 'Complaints Register', margin, 40);
  doc.setFont('helvetica', 'normal'); doc.setFontSize(9); doc.setTextColor(120);
  doc.text(`Exported ${d(localToday())} · ${items.length} complaint${items.length !== 1 ? 's' : ''}`, margin, 56);
  doc.setTextColor(0);

  let y = 78;
  const drawHeader = () => {
    doc.setFillColor(243, 244, 246);
    doc.rect(margin, y - 12, usableW, 18, 'F');
    doc.setFont('helvetica', 'bold'); doc.setFontSize(8); doc.setTextColor(80);
    let x = margin;
    headers.forEach((h, i) => { doc.text(h.toUpperCase(), x + pad, y); x += widths[i]; });
    doc.setTextColor(0); doc.setFont('helvetica', 'normal'); doc.setFontSize(8.5);
    y += 14;
  };
  drawHeader();

  items.forEach((c) => {
    const w0 = widths[0] - pad * 2;
    const head = doc.splitTextToSize(c.complainant_name || '', w0);
    const desc = c.details ? doc.splitTextToSize(c.details, w0) : [];
    const meta = doc.splitTextToSize(`ID: ${c.complaint_code || '—'}${c.complaint_date ? `   ${d(c.complaint_date)}` : ''}`, w0);
    const cells = [null, c.status, c.severity, c.taken_by, c.corrective_action, ...extra.map(([, f]) => f(c))];
    const wrapped = cells.map((v, i) => (i === 0 ? [] : doc.splitTextToSize(String(v || '—'), widths[i] - pad * 2)));
    const rowH = Math.max(head.length + desc.length + meta.length, ...wrapped.map((w) => w.length)) * lineH + pad * 2;
    if (y + rowH > pageH - margin) { doc.addPage(); y = margin + 20; drawHeader(); }
    const ty = y + pad + 4;
    let ly = ty;
    doc.setFont('helvetica', 'bold'); doc.text(head, margin + pad, ly); ly += head.length * lineH;
    doc.setFont('helvetica', 'normal');
    if (desc.length) { doc.setTextColor(60); doc.text(desc, margin + pad, ly); ly += desc.length * lineH; }
    doc.setFontSize(7.5); doc.setTextColor(120); doc.text(meta, margin + pad, ly);
    doc.setFontSize(8.5); doc.setTextColor(0);
    let x = margin + widths[0];
    for (let i = 1; i < cells.length; i++) {
      const color = BADGES[i]?.find((o) => o.name === cells[i])?.color;
      if (color) {
        const w = doc.getTextWidth(cells[i]) + 10;
        doc.setFillColor(...RGB[color].bg); doc.roundedRect(x + pad, ty - 9, w, 13, 3, 3, 'F');
        doc.setTextColor(...RGB[color].text); doc.text(cells[i], x + pad + 5, ty); doc.setTextColor(0);
      } else { if (!cells[i]) doc.setTextColor(170); doc.text(wrapped[i], x + pad, ty); doc.setTextColor(0); }
      x += widths[i];
    }
    doc.setDrawColor(229, 231, 235);
    doc.line(margin, y + rowH - 2, margin + usableW, y + rowH - 2);
    y += rowH;
  });
  doc.save(`${fileBase(title)}.pdf`);
}