import { jsPDF } from 'jspdf';
import { writeStyledWorkbook } from '@/lib/export/excelWorkbook';
import { format, parseISO } from 'date-fns';

// ── Value helpers (mirror GrantTable rendering) ──────────────────────────────

function fmtDate(d) {
  if (!d) return '';
  try { return format(parseISO(d), 'd MMM yyyy'); } catch { return String(d); }
}

function fmtAmount(n) {
  if (!n && n !== 0) return '';
  return '$' + Number(n).toLocaleString();
}

// Mirrors fmtAmount's PDF output ($ + thousands separators, no decimals) so the
// Funding Amount column reads the same in Excel and PDF.
const CURRENCY_NUM_FMT = '"$"#,##0';

// Columns matching the Grant Register table.
const COLUMNS = [
  { id: 'name', label: 'Grant Title' },
  { id: 'total_amount', label: 'Funding Amount' },
  { id: 'provider', label: 'Grant Provider' },
  { id: 'program', label: 'Grant Activity' },
  { id: 'start_date', label: 'Start Date' },
  { id: 'end_date', label: 'End Date' },
  { id: 'status', label: 'Status', kind: 'status' },
];

function cellText(grant, col) {
  switch (col.id) {
    case 'name': return grant.name || '';
    case 'total_amount': return fmtAmount(grant.total_amount);
    case 'provider': return grant.provider || '';
    case 'program': return grant.program || '';
    case 'start_date': return fmtDate(grant.start_date);
    case 'end_date': return fmtDate(grant.end_date);
    case 'status': return grant.status || '';
    default: return '';
  }
}

// ── Excel export ─────────────────────────────────────────────────────────────

export function exportGrantsToExcel(grants) {
  const rows = grants.map((g) => ({
    'Grant Title': g.name || '',
    'Reference': g.reference_id || '',
    'Funding Amount': g.total_amount ?? '',
    'Grant Provider': g.provider || '',
    'Grant Activity': g.program || '',
    'Start Date': fmtDate(g.start_date),
    'End Date': fmtDate(g.end_date),
    'Status': g.status || '',
  }));

  return writeStyledWorkbook({
    fileName: `grant-register-${format(new Date(), 'yyyy-MM-dd')}.xlsx`,
    sheetName: 'Grants',
    headers: [
      'Grant Title', 'Reference', 'Funding Amount', 'Grant Provider',
      'Grant Activity', 'Start Date', 'End Date', 'Status',
    ],
    rows: rows.length ? rows : [{ 'Grant Title': '' }],
    // The amount stays a real number so it remains sortable/summable in Excel;
    // the currency format makes it *display* identically to the PDF ($300,000).
    cellStyle: (row, header) =>
      header === 'Funding Amount' ? { numFmt: CURRENCY_NUM_FMT } : undefined,
  });
}

// ── PDF export (landscape, colored status badge to match UI) ──────────────────

// RGB equivalents of the Tailwind grant status palette.
const STATUS_RGB = {
  active: { bg: [220, 252, 231], text: [21, 128, 61] },
  closed: { bg: [219, 234, 254], text: [29, 78, 216] },
  archived: { bg: [254, 243, 199], text: [180, 83, 9] },
};

// Neutral grey for any unrecognised status — never fall back to a meaningful colour.
const STATUS_RGB_FALLBACK = { bg: [243, 244, 246], text: [75, 85, 99] };

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

export function exportGrantsToPdf(grants, meta = {}) {
  const doc = new jsPDF({ orientation: 'landscape', unit: 'pt', format: 'a4' });
  const pageW = doc.internal.pageSize.getWidth();
  const pageH = doc.internal.pageSize.getHeight();
  const margin = 32;
  const usableW = pageW - margin * 2;

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(15);
  doc.text('Grant Register', margin, 40);
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9);
  doc.setTextColor(120);
  const metaParts = [
    // fmtDate() only accepts ISO date strings — format the live Date directly
    // so the subtitle never falls back to Date.toString() (which includes time/timezone).
    `Exported ${format(new Date(), 'd MMM yyyy')}`,
    `${grants.length} grant${grants.length !== 1 ? 's' : ''}`,
  ];
  if (meta.scope) metaParts.push(meta.scope);
  doc.text(metaParts.join(' · '), margin, 56);
  doc.setTextColor(0);

  const nameW = Math.min(180, usableW * 0.2);
  const restCount = COLUMNS.length - 1;
  const restW = (usableW - nameW) / restCount;
  const colW = [nameW, ...Array(restCount).fill(restW)];

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

  grants.forEach((grant) => {
    const cellInfos = COLUMNS.map((col, i) => {
      if (col.kind === 'status') {
        const label = (grant.status || '').charAt(0).toUpperCase() + (grant.status || '').slice(1);
        return { kind: 'status', label, rgb: STATUS_RGB[grant.status] || STATUS_RGB_FALLBACK, lines: 1 };
      }
      const text = cellText(grant, col);
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
      } else {
        doc.text(info.wrapped, x + cellPad, textY, { maxWidth: colW[i] - cellPad * 2 });
      }
      x += colW[i];
    });

    doc.setDrawColor(229, 231, 235);
    doc.line(margin, y + rowH - cellPad, margin + usableW, y + rowH - cellPad);
    y += rowH;
  });

  doc.save(`grant-register-${format(new Date(), 'yyyy-MM-dd')}.pdf`);
}