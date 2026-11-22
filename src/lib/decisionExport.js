import { jsPDF } from 'jspdf';
import { writeStyledWorkbook } from '@/lib/export/excelWorkbook';
import { formatDate } from '@/lib/meetingActionApi';
import { localToday } from '@/lib/localClock';
import { decisionStatus, decisionMeta } from '@/lib/decisions';

const fileBase = (title) => (title || 'decisions-register').replace(/[^\w-]+/g, '_');
const dateText = (iso) => (iso ? formatDate(iso) : '');

/** Excel export: every recorded field. `allDecisions` resolves earlier-decision titles. */
export function exportDecisionsToExcel(decisions, title, allDecisions) {
  const titleById = new Map(allDecisions.map((d) => [d.id, d.title]));
  const rows = decisions.map((d) => ({
    'Decision': d.title || '',
    'Decision as Minuted': d.minuted_text || '',
    'Type': d.decision_type || '',
    'Outcome': d.outcome || '',
    'Decision Date': dateText(d.decision_date),
    'Status': decisionStatus(d),
    'Meeting Title': d.meeting_name || '',
    'Meeting Date': dateText(d.meeting_date),
    'Agenda Item': d.agenda_item || '',
    'Mover': d.mover || '',
    'Seconder': d.seconder || '',
    'For': d.votes_for ?? '',
    'Against': d.votes_against ?? '',
    'Abstained': d.votes_abstained ?? '',
    'Replaces an Earlier Decision?': d.disposition || 'No',
    'Earlier Decision': titleById.get(d.earlier_decision_id) || '',
  }));
  return writeStyledWorkbook({
    fileName: `${fileBase(title)}.xlsx`,
    sheetName: 'Decisions',
    headers: Object.keys(rows[0] || { 'Decision': '' }),
    rows,
  });
}

/** PDF export: landscape table matching the register's columns. */
export function exportDecisionsToPdf(decisions, title) {
  const doc = new jsPDF({ orientation: 'landscape', unit: 'pt', format: 'a4' });
  const pageW = doc.internal.pageSize.getWidth();
  const pageH = doc.internal.pageSize.getHeight();
  const margin = 32;
  const pad = 4;
  const lineH = 11;
  const usableW = pageW - margin * 2;
  const columns = [
    { label: 'Decision', width: usableW * 0.46 },
    { label: 'Type', width: usableW * 0.12 },
    { label: 'Outcome', width: usableW * 0.12 },
    { label: 'Decision Date', width: usableW * 0.15 },
    { label: 'Status', width: usableW * 0.15 },
  ];

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(15);
  doc.text(title || 'Decisions Register', margin, 40);
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9);
  doc.setTextColor(120);
  doc.text(`Exported ${formatDate(localToday())} · ${decisions.length} decision${decisions.length !== 1 ? 's' : ''}`, margin, 56);
  doc.setTextColor(0);

  let y = 78;
  const drawHeader = () => {
    doc.setFillColor(243, 244, 246);
    doc.rect(margin, y - 12, usableW, 18, 'F');
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(8);
    doc.setTextColor(80);
    let x = margin;
    columns.forEach((col) => {
      doc.text(col.label.toUpperCase(), x + pad, y);
      x += col.width;
    });
    doc.setTextColor(0);
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8.5);
    y += 14;
  };
  drawHeader();

  decisions.forEach((d) => {
    const cells = [d.title || '', d.decision_type || '', d.outcome || '', dateText(d.decision_date), decisionStatus(d)];
    const lines = cells.map((cell, i) => doc.splitTextToSize(String(cell), columns[i].width - pad * 2));
    const meta = decisionMeta(d);
    const metaLines = meta ? doc.splitTextToSize(meta, columns[0].width - pad * 2) : [];
    const rowLines = Math.max(lines[0].length + metaLines.length, ...lines.map((l) => l.length));
    const rowH = rowLines * lineH + pad * 2;

    if (y + rowH > pageH - margin) {
      doc.addPage();
      y = margin + 20;
      drawHeader();
    }

    let x = margin;
    const textY = y + pad + 4;
    lines.forEach((cellLines, i) => {
      doc.text(cellLines, x + pad, textY);
      if (i === 0 && metaLines.length) {
        doc.setTextColor(120);
        doc.text(metaLines, x + pad, textY + cellLines.length * lineH);
        doc.setTextColor(0);
      }
      x += columns[i].width;
    });
    doc.setDrawColor(229, 231, 235);
    doc.line(margin, y + rowH - pad, margin + usableW, y + rowH - pad);
    y += rowH;
  });

  doc.save(`${fileBase(title)}.pdf`);
}