import { jsPDF } from 'jspdf';
import { writeStyledWorkbook } from '@/lib/export/excelWorkbook';
import { formatReviewDate } from '@/lib/complianceRegisters';
import { GIFT_TYPE_OPTIONS, COI_OPTIONS, APPROVAL_OPTIONS, formatMoney, financialYearOf, optionLabel } from '@/lib/giftRegister';
import { localToday } from '@/lib/localClock';

const d = (v) => (v ? formatReviewDate(v) : '');
const fileBase = (title) => (title || 'gift-register').replace(/[^\w-]+/g, '_');

const EXCEL_COLS = [
  ['Record ID', (g) => g.record_code], ['Date Received', (g) => d(g.date_received)],
  ['Financial Year', (g) => g.financial_year || financialYearOf(g.date_received) || ''], ['Type', (g) => g.gift_type],
  ['Title of Gift/Benefit', (g) => g.title], ['Description of Gift/Benefit', (g) => g.description],
  ['Reason for Gift/Benefit', (g) => g.reason], ['Presented By', (g) => g.presented_by],
  ['Nature of Relationship', (g) => g.relationship_nature], ['Received By', (g) => g.received_by],
  ['Estimated Market Value', (g) => formatMoney(g.estimated_value)], ['Conflict of Interest', (g) => g.conflict_of_interest],
  ['Conflict Details', (g) => g.conflict_details], ['Declaration Date', (g) => d(g.declaration_date)],
  ['Approval Decision', (g) => g.approval_decision], ['Approved By', (g) => g.approved_by],
];

export function exportGiftsToExcel(gifts, title) {
  return writeStyledWorkbook({
    fileName: `${fileBase(title)}.xlsx`,
    sheetName: 'Gifts and Benefits',
    headers: EXCEL_COLS.map(([h]) => h),
    rows: gifts.map((g) => Object.fromEntries(EXCEL_COLS.map(([h, f]) => [h, f(g) || '']))),
  });
}

const RGB = {
  green: { bg: [220, 252, 231], text: [21, 128, 61] }, orange: { bg: [255, 237, 213], text: [194, 65, 12] },
  red: { bg: [254, 226, 226], text: [185, 28, 28] }, blue: { bg: [219, 234, 254], text: [29, 78, 216] },
  purple: { bg: [243, 232, 255], text: [126, 34, 206] }, gray: { bg: [243, 244, 246], text: [75, 85, 99] },
};
const colorOf = (opts, v) => opts.find((o) => o.name === v)?.color;

// Mirrors the on-screen table columns.
const HEADERS = ['Gift/Benefit', 'Type', 'Presented By', 'Received By', 'Market Value', 'Conflict of Interest', 'Approval Decision'];
const RATIOS = [0.34, 0.08, 0.11, 0.11, 0.1, 0.13, 0.13];
const BADGE_OPTS = { 1: GIFT_TYPE_OPTIONS, 5: COI_OPTIONS, 6: APPROVAL_OPTIONS };

function drawBadge(doc, label, maxW, x, y, c) {
  const lines = doc.splitTextToSize(label, maxW - 10);
  const w = Math.max(...lines.map((l) => doc.getTextWidth(l))) + 10;
  doc.setFillColor(...c.bg);
  doc.roundedRect(x, y - 9, w, lines.length * 11 + 2, 3, 3, 'F');
  doc.setTextColor(...c.text);
  doc.text(lines, x + 5, y);
  doc.setTextColor(0);
  return lines.length;
}

export function exportGiftsToPdf(gifts, title) {
  const doc = new jsPDF({ orientation: 'landscape', unit: 'pt', format: 'a4' });
  const pageW = doc.internal.pageSize.getWidth();
  const pageH = doc.internal.pageSize.getHeight();
  const margin = 32; const usableW = pageW - margin * 2;
  const widths = RATIOS.map((r) => r * usableW);
  const pad = 5; const lineH = 11;

  doc.setFont('helvetica', 'bold'); doc.setFontSize(15);
  doc.text(title || 'Gift, Benefits and Hospitality Register', margin, 40);
  doc.setFont('helvetica', 'normal'); doc.setFontSize(9); doc.setTextColor(120);
  doc.text(`Exported ${d(localToday())} · ${gifts.length} record${gifts.length !== 1 ? 's' : ''}`, margin, 56);
  doc.setTextColor(0);

  let y = 78;
  const drawHeader = () => {
    doc.setFillColor(243, 244, 246);
    doc.rect(margin, y - 12, usableW, 18, 'F');
    doc.setFont('helvetica', 'bold'); doc.setFontSize(8); doc.setTextColor(80);
    let x = margin;
    HEADERS.forEach((h, i) => { doc.text(h.toUpperCase(), x + pad, y, { maxWidth: widths[i] - pad * 2 }); x += widths[i]; });
    doc.setTextColor(0); doc.setFont('helvetica', 'normal'); doc.setFontSize(8.5);
    y += 14;
  };
  drawHeader();

  gifts.forEach((g) => {
    const w0 = widths[0] - pad * 2;
    const head = doc.splitTextToSize(g.title || g.description || '', w0);
    const desc = g.title && g.description ? doc.splitTextToSize(g.description, w0) : [];
    const meta = doc.splitTextToSize(`${g.record_code || ''} · Received ${d(g.date_received) || '—'} · Declared ${d(g.declaration_date) || '—'}`, w0);
    const cells = [null, g.gift_type, g.presented_by, g.received_by, formatMoney(g.estimated_value), g.conflict_of_interest, g.approval_decision].map((v) => v || '');
    const wrapped = cells.map((c, i) => (i === 0 ? [] : doc.splitTextToSize(String(c || '—'), widths[i] - pad * 2)));
    const rowLines = Math.max(head.length + desc.length + meta.length, ...wrapped.map((w) => w.length));
    const rowH = rowLines * lineH + pad * 2;
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
      const color = BADGE_OPTS[i] && colorOf(BADGE_OPTS[i], cells[i]);
      if (color) drawBadge(doc, optionLabel(BADGE_OPTS[i], cells[i]), widths[i] - pad * 2, x + pad, ty, RGB[color] || RGB.gray);
      else { if (!cells[i]) doc.setTextColor(170); doc.text(wrapped[i], x + pad, ty); doc.setTextColor(0); }
      x += widths[i];
    }
    doc.setDrawColor(229, 231, 235);
    doc.line(margin, y + rowH - 2, margin + usableW, y + rowH - 2);
    y += rowH;
  });

  doc.save(`${fileBase(title)}.pdf`);
}