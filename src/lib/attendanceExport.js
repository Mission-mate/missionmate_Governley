import { jsPDF } from 'jspdf';
import { writeStyledWorkbook } from '@/lib/export/excelWorkbook';
import { format } from 'date-fns';

const TITLE = 'Member Attendance Records';
const SUBTITLE = 'Meeting attendance statistics across all meetings';

// ── Excel export (percentage only, no bar) ───────────────────────────────────

export function exportAttendanceToExcel(rows, meta = {}) {
  const orgName = meta.orgName || 'Organisation';
  const periodLabel = meta.periodLabel || '';
  const committeeLabel = meta.committeeLabel || '';

  const dataRows = rows.map((r) => ({
    'Member': r.member_name || '',
    'Position': r.position || '',
    'Meetings Invited': r.total,
    'Meetings Attended': `${r.present}/${r.total}`,
    'Apologies': r.apology,
    'Absences': r.absent,
    'Attendance Rate': `${r.rate}%`,
  }));

  // Heading rows above the table
  const preRows = [
    [orgName],
    [TITLE],
    [SUBTITLE],
    committeeLabel ? [`Committee: ${committeeLabel}`] : [],
    periodLabel ? [`Period: ${periodLabel}`] : [],
    [],
  ];

  return writeStyledWorkbook({
    fileName: `member-attendance-${format(new Date(), 'yyyy-MM-dd')}.xlsx`,
    sheetName: 'Attendance',
    headers: ['Member', 'Position', 'Meetings Invited', 'Meetings Attended', 'Apologies', 'Absences', 'Attendance Rate'],
    rows: dataRows.length ? dataRows : [{ 'Member': '' }],
    preRows,
  });
}

// ── PDF export (with attendance rate bar) ────────────────────────────────────

function rateColors(rate, good = 75, atRisk = 50) {
  if (rate >= good) return { bar: [34, 197, 94], text: [22, 163, 74] };
  if (rate >= atRisk) return { bar: [245, 158, 11], text: [217, 119, 6] };
  return { bar: [239, 68, 68], text: [220, 38, 38] };
}

export function exportAttendanceToPdf(rows, meta = {}) {
  const orgName = meta.orgName || 'Organisation';
  const periodLabel = meta.periodLabel || '';
  const committeeLabel = meta.committeeLabel || '';
  const good = meta.goodThreshold ?? 75;
  const atRisk = meta.atRiskThreshold ?? 50;

  const doc = new jsPDF({ orientation: 'landscape', unit: 'pt', format: 'a4' });
  const pageW = doc.internal.pageSize.getWidth();
  const pageH = doc.internal.pageSize.getHeight();
  const margin = 32;
  const usableW = pageW - margin * 2;

  // Organisation name
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(11);
  doc.setTextColor(80);
  doc.text(orgName, margin, 36);

  // Title
  doc.setFontSize(16);
  doc.setTextColor(0);
  doc.text(TITLE, margin, 58);

  // Subtitle
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9.5);
  doc.setTextColor(120);
  doc.text(SUBTITLE, margin, 73);

  // Meta line
  const metaParts = [`Exported ${format(new Date(), 'd MMM yyyy')}`];
  if (committeeLabel) metaParts.push(`Committee: ${committeeLabel}`);
  if (periodLabel) metaParts.push(`Period: ${periodLabel}`);
  doc.setFontSize(9);
  doc.text(metaParts.join('  ·  '), margin, 88);
  doc.setTextColor(0);

  // Summary cards (Overall Attendance, Good Attendance, At Risk)
  const summary = meta.summary || {};
  const cardsY = 104;
  const cardH = 58;
  const cardGap = 14;
  const cardW = (usableW - cardGap * 2) / 3;
  const cards = [
    { label: 'Overall Attendance', value: `${summary.overall ?? 0}%`, sub: 'Average attendance rate', accent: [37, 99, 235], fill: [239, 246, 255] },
    { label: 'Good Attendance', value: String(summary.good ?? 0), sub: `Members above ${good}% rate`, accent: [22, 163, 74], fill: [240, 253, 244] },
    { label: 'At Risk', value: String(summary.atRisk ?? 0), sub: `Below ${atRisk}% attendance`, accent: [220, 38, 38], fill: [254, 242, 242] },
  ];
  cards.forEach((c, i) => {
    const cx = margin + i * (cardW + cardGap);
    doc.setFillColor(...c.fill);
    doc.setDrawColor(229, 231, 235);
    doc.roundedRect(cx, cardsY, cardW, cardH, 6, 6, 'FD');
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(9);
    doc.setTextColor(90);
    doc.text(c.label, cx + 12, cardsY + 18);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(20);
    doc.setTextColor(...c.accent);
    doc.text(c.value, cx + 12, cardsY + 42);
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8);
    doc.setTextColor(120);
    doc.text(c.sub, cx + 12, cardsY + 52);
  });
  doc.setTextColor(0);

  // Columns
  const cols = [
    { id: 'member', label: 'Member', w: 0.22 },
    { id: 'role', label: 'Position', w: 0.16 },
    { id: 'invited', label: 'Meetings Invited', w: 0.12 },
    { id: 'attended', label: 'Meetings Attended', w: 0.13 },
    { id: 'apologies', label: 'Apologies', w: 0.09 },
    { id: 'absences', label: 'Absences', w: 0.09 },
    { id: 'rate', label: 'Attendance Rate', w: 0.19 },
  ];
  const colW = cols.map((c) => c.w * usableW);
  const colX = [];
  cols.reduce((acc, _, i) => { colX[i] = acc; return acc + colW[i]; }, margin);

  let y = cardsY + cardH + 28;
  const cellPad = 6;

  const drawHeader = () => {
    doc.setFillColor(243, 244, 246);
    doc.rect(margin, y - 12, usableW, 18, 'F');
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(8);
    doc.setTextColor(80);
    cols.forEach((c, i) => {
      doc.text(String(c.label).toUpperCase(), colX[i] + cellPad, y, { maxWidth: colW[i] - cellPad * 2 });
    });
    doc.setTextColor(0);
    y += 18;
  };

  drawHeader();

  const rowH = 26;
  rows.forEach((r) => {
    if (y + rowH > pageH - margin) {
      doc.addPage();
      y = margin + 20;
      drawHeader();
    }

    const textY = y + rowH / 2 + 3;

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(9);
    doc.setTextColor(0);
    doc.text(String(r.member_name || ''), colX[0] + cellPad, textY, { maxWidth: colW[0] - cellPad * 2 });

    doc.setFont('helvetica', 'normal');
    doc.setTextColor(110);
    doc.text(String(r.position || '—'), colX[1] + cellPad, textY, { maxWidth: colW[1] - cellPad * 2 });

    doc.setTextColor(0);
    doc.text(String(r.total), colX[2] + cellPad, textY);
    doc.text(`${r.present}/${r.total}`, colX[3] + cellPad, textY);

    doc.setTextColor(217, 119, 6);
    doc.text(String(r.apology), colX[4] + cellPad, textY);

    doc.setTextColor(220, 38, 38);
    doc.text(String(r.absent), colX[5] + cellPad, textY);

    // Attendance rate bar
    const { bar, text } = rateColors(r.rate, good, atRisk);
    const barX = colX[6] + cellPad;
    const barMaxW = colW[6] - cellPad * 2 - 44;
    const barH = 6;
    const barY = y + rowH / 2 - barH / 2;
    doc.setFillColor(229, 231, 235);
    doc.roundedRect(barX, barY, barMaxW, barH, 3, 3, 'F');
    doc.setFillColor(...bar);
    doc.roundedRect(barX, barY, Math.max(0, (r.rate / 100) * barMaxW), barH, 3, 3, 'F');
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(...text);
    doc.text(`${r.rate}%`, barX + barMaxW + 8, textY);

    doc.setTextColor(0);
    doc.setDrawColor(235, 237, 240);
    doc.line(margin, y + rowH, margin + usableW, y + rowH);
    y += rowH;
  });

  doc.save(`member-attendance-${format(new Date(), 'yyyy-MM-dd')}.pdf`);
}