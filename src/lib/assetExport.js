import { jsPDF } from 'jspdf';
import { writeStyledWorkbook } from '@/lib/export/excelWorkbook';
import { fmtDate } from '@/lib/assetRegister';
import { localToday } from '@/lib/localClock';

const HEADERS = ['Asset ID', 'Asset Title', 'Serial Number', 'Asset Type', 'Location', 'Condition', 'Status', 'Warranty Expiry', 'Purchase Date'];

const cellsFor = (a) => [
  a.asset_id || '', a.title || '', a.serial_number || '', a.asset_type || '', a.location || '',
  a.condition || '', a.status || '', fmtDate(a.warranty_expiry), fmtDate(a.purchase_date),
];

const fileBase = (title) => (title || 'asset-register').replace(/[^\w-]+/g, '_');

export function exportAssetsToExcel(assets, title) {
  return writeStyledWorkbook({
    fileName: `${fileBase(title)}.xlsx`,
    sheetName: 'Assets',
    headers: HEADERS,
    rows: assets.map((a) => Object.fromEntries(cellsFor(a).map((v, i) => [HEADERS[i], v]))),
  });
}

const BADGE_RGB = {
  green: { bg: [220, 252, 231], text: [21, 128, 61] },
  orange: { bg: [255, 237, 213], text: [194, 65, 12] },
  red: { bg: [254, 226, 226], text: [185, 28, 28] },
};
const BADGES = { 5: { Good: 'green', Fair: 'orange', Poor: 'red' }, 6: { Active: 'green', Disposed: 'red' } };

function drawBadge(doc, label, colorKey, x, y) {
  const c = BADGE_RGB[colorKey];
  const w = doc.getTextWidth(label) + 10;
  doc.setFillColor(...c.bg);
  doc.roundedRect(x, y - 9, w, 13, 3, 3, 'F');
  doc.setTextColor(...c.text);
  doc.text(label, x + 5, y);
  doc.setTextColor(0);
}

export function exportAssetsToPdf(assets, title) {
  const doc = new jsPDF({ orientation: 'landscape', unit: 'pt', format: 'a4' });
  const pageW = doc.internal.pageSize.getWidth();
  const pageH = doc.internal.pageSize.getHeight();
  const margin = 32;
  const usableW = pageW - margin * 2;
  const ratios = [0.08, 0.2, 0.11, 0.11, 0.11, 0.08, 0.08, 0.115, 0.115];
  const widths = ratios.map((r) => r * usableW);
  const pad = 4; const lineH = 11;

  doc.setFont('helvetica', 'bold'); doc.setFontSize(15);
  doc.text(title || 'Asset Register', margin, 40);
  doc.setFont('helvetica', 'normal'); doc.setFontSize(9); doc.setTextColor(120);
  doc.text(`Exported ${fmtDate(localToday())} · ${assets.length} asset${assets.length !== 1 ? 's' : ''}`, margin, 56);
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

  assets.forEach((a) => {
    const cells = cellsFor(a);
    const wrapped = cells.map((c, i) => doc.splitTextToSize(String(c), widths[i] - pad * 2));
    const rowH = Math.max(1, ...wrapped.map((w) => w.length)) * lineH + pad * 2;
    if (y + rowH > pageH - margin) { doc.addPage(); y = margin + 20; drawHeader(); }
    let x = margin;
    wrapped.forEach((lines, i) => {
      const ty = y + pad + 4;
      const badge = BADGES[i]?.[cells[i]];
      if (badge) drawBadge(doc, cells[i], badge, x + pad, ty);
      else doc.text(lines, x + pad, ty);
      x += widths[i];
    });
    doc.setDrawColor(229, 231, 235);
    doc.line(margin, y + rowH - pad, margin + usableW, y + rowH - pad);
    y += rowH;
  });

  doc.save(`${fileBase(title)}.pdf`);
}