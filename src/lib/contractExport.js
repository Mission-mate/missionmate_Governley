import { jsPDF } from 'jspdf';
import { writeStyledWorkbook } from '@/lib/export/excelWorkbook';
import { formatReviewDate } from '@/lib/complianceRegisters';
import { formatMoney } from '@/lib/giftRegister';
import { CONTRACT_STATUS_OPTIONS } from '@/lib/contractRegister';
import { localToday } from '@/lib/localClock';

const d = (v) => (v ? formatReviewDate(v) : '');
const fileBase = (title) => (title || 'contract-register').replace(/[^\w-]+/g, '_');

const EXCEL_COLS = [
  ['Contract Reference', (c) => c.contract_code], ['Contract Title', (c) => c.title], ['Description', (c) => c.description],
  ['Type', (c) => c.contract_type], ['Status', (c) => c.status || 'Active'], ['Contract Owner', (c) => c.owner],
  ['Contract Manager', (c) => c.manager], ['Business Division', (c) => c.business_division], ['Counterparty', (c) => c.party_name],
  ['Contract Value', (c) => (c.has_financial_value ? formatMoney(c.value) : '')], ['Start Date', (c) => d(c.start_date)],
  ['Expiry Date', (c) => d(c.expiry_date)], ['Review Frequency', (c) => c.review_frequency],
  ['Last Review Date', (c) => d(c.last_review_date)], ['Next Review Date', (c) => d(c.next_review_date)],
];

export function exportContractsToExcel(contracts, title) {
  return writeStyledWorkbook({
    fileName: `${fileBase(title)}.xlsx`,
    sheetName: 'Contracts',
    headers: EXCEL_COLS.map(([h]) => h),
    rows: contracts.map((c) => Object.fromEntries(EXCEL_COLS.map(([h, f]) => [h, f(c) || '']))),
  });
}

const RGB = {
  green: { bg: [220, 252, 231], text: [21, 128, 61] }, orange: { bg: [255, 237, 213], text: [194, 65, 12] },
  red: { bg: [254, 226, 226], text: [185, 28, 28] }, blue: { bg: [219, 234, 254], text: [29, 78, 216] },
  purple: { bg: [243, 232, 255], text: [126, 34, 206] }, gray: { bg: [243, 244, 246], text: [75, 85, 99] },
};

// Mirrors the on-screen table columns.
const HEADERS = ['Contract', 'Value', 'Start Date', 'Expiry Date', 'Next Review Date', 'Status'];
const RATIOS = [0.5, 0.1, 0.1, 0.1, 0.11, 0.09];
const REVIEW_COL = 4;

function drawBadge(doc, label, maxW, x, y, c) {
  const lines = doc.splitTextToSize(label, maxW - 10);
  const w = Math.max(...lines.map((l) => doc.getTextWidth(l))) + 10;
  doc.setFillColor(...c.bg);
  doc.roundedRect(x, y - 9, w, lines.length * 11 + 2, 3, 3, 'F');
  doc.setTextColor(...c.text);
  doc.text(lines, x + 5, y);
  doc.setTextColor(0);
}

export function exportContractsToPdf(contracts, title, typeOptions) {
  const doc = new jsPDF({ orientation: 'landscape', unit: 'pt', format: 'a4' });
  const pageW = doc.internal.pageSize.getWidth();
  const pageH = doc.internal.pageSize.getHeight();
  const margin = 32; const usableW = pageW - margin * 2;
  const widths = RATIOS.map((r) => r * usableW);
  const pad = 5; const lineH = 11;
  const badgeOpts = { 5: CONTRACT_STATUS_OPTIONS };
  const today = localToday();

  doc.setFont('helvetica', 'bold'); doc.setFontSize(15);
  doc.text(title || 'Contract Register', margin, 40);
  doc.setFont('helvetica', 'normal'); doc.setFontSize(9); doc.setTextColor(120);
  doc.text(`Exported ${d(localToday())} · ${contracts.length} contract${contracts.length !== 1 ? 's' : ''}`, margin, 56);
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

  contracts.forEach((c) => {
    const w0 = widths[0] - pad * 2;
    const head = doc.splitTextToSize(c.title || '', w0);
    const desc = c.description ? doc.splitTextToSize(c.description, w0) : [];
    const meta = doc.splitTextToSize([c.contract_code, c.owner && `Owner: ${c.owner}`, c.manager && `Manager: ${c.manager}`].filter(Boolean).join(' · '), w0);
    doc.setFontSize(7.5);
    const lastMeta = meta[meta.length - 1] || '';
    const typeW = c.contract_type ? doc.getTextWidth(c.contract_type) + 18 : 0;
    const typeInline = !typeW || doc.getTextWidth(lastMeta) + typeW <= w0;
    doc.setFontSize(8.5);
    const overdue = (c.status || 'Active') === 'Active' && !!c.next_review_date && c.next_review_date < today;
    const cells = [null, formatMoney(c.value), d(c.start_date), d(c.expiry_date), d(c.next_review_date), c.status || 'Active'].map((v) => v || '');
    const wrapped = cells.map((v, i) => (i === 0 ? [] : doc.splitTextToSize(String(v || '—'), widths[i] - pad * 2)));
    const metaLines = meta.length + (typeInline ? 0 : 1);
    const rowH = Math.max(head.length + desc.length + metaLines + (typeW ? 0.3 : 0), overdue ? 2 : 1, ...wrapped.map((w) => w.length)) * lineH + pad * 2;
    if (y + rowH > pageH - margin) { doc.addPage(); y = margin + 20; drawHeader(); }
    const ty = y + pad + 4;

    let ly = ty;
    doc.setFont('helvetica', 'bold'); doc.text(head, margin + pad, ly); ly += head.length * lineH;
    doc.setFont('helvetica', 'normal');
    if (desc.length) { doc.setTextColor(60); doc.text(desc, margin + pad, ly); ly += desc.length * lineH; }
    doc.setFontSize(7.5); doc.setTextColor(120); doc.text(meta, margin + pad, ly);
    if (typeW) {
      const tx = margin + pad + (typeInline && lastMeta ? doc.getTextWidth(lastMeta) + 8 : 0);
      const tyy = ly + (typeInline ? meta.length - 1 : meta.length) * lineH;
      const color = typeOptions?.find((o) => o.name === c.contract_type)?.color;
      drawBadge(doc, c.contract_type, w0, tx, tyy, RGB[color] || RGB.blue);
    }
    doc.setFontSize(8.5); doc.setTextColor(0);

    let x = margin + widths[0];
    for (let i = 1; i < cells.length; i++) {
      const color = badgeOpts[i]?.find((o) => o.name === cells[i])?.color;
      if (color) drawBadge(doc, cells[i], widths[i] - pad * 2, x + pad, ty, RGB[color] || RGB.gray);
      else if (i === REVIEW_COL && overdue) {
        doc.setTextColor(185, 28, 28); doc.setFont('helvetica', 'bold'); doc.text(wrapped[i], x + pad, ty);
        doc.setFont('helvetica', 'normal'); doc.setFontSize(7.5); doc.text('Overdue', x + pad, ty + lineH);
        doc.setFontSize(8.5); doc.setTextColor(0);
      } else { if (!cells[i]) doc.setTextColor(170); doc.text(wrapped[i], x + pad, ty); doc.setTextColor(0); }
      x += widths[i];
    }
    doc.setDrawColor(229, 231, 235);
    doc.line(margin, y + rowH - 2, margin + usableW, y + rowH - 2);
    y += rowH;
  });

  doc.save(`${fileBase(title)}.pdf`);
}