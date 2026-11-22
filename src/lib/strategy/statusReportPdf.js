import jsPDF from 'jspdf';
import { toLocalISODate } from '@/lib/localClock';
import { REPORT_SECTIONS, reportSections } from '@/lib/strategy/statusReportSections';
import {
  POSITION_LABEL,
  POSITION_RGB,
  formatGap,
  formatMeasureValue,
} from '@/lib/strategy/measurePosition';

const NAVY = [30, 41, 59];
const PRIMARY = [37, 99, 235];
const MUTED = [100, 116, 139];
const LIGHT = [241, 245, 249];
const BODY = [51, 65, 85];

const SEVERITY_RGB = { info: [37, 99, 235], warning: [217, 119, 6], critical: [220, 38, 38] };
const RATING_RGB = { on_track: [22, 163, 74], at_risk: [217, 119, 6], off_track: [220, 38, 38] };
const RATING_LABEL = { on_track: 'On Track', at_risk: 'At Risk', off_track: 'Off Track' };

const STRING_ARRAY_FIELDS = ['gaps', 'opportunities', 'recommendations'];
const FINDING_FIELDS = ['data_quality_findings', 'risks_and_blockers'];

/** Build a board-ready PDF from a generated or saved Strategy Status Report. */
export function downloadStrategyReportPdf(report, orgName = 'Organisation') {
  const doc = new jsPDF({ unit: 'pt', format: 'a4' });
  const pageW = doc.internal.pageSize.getWidth();
  const pageH = doc.internal.pageSize.getHeight();
  const margin = 48;
  const contentW = pageW - margin * 2;
  let y = margin;

  const metrics = report?.metrics || {};
  const narrative = report?.narrative || {};
  const overall = metrics.overall || {};
  const strategy = metrics.strategy || {};
  const generated = report?.generated_at ? new Date(report.generated_at) : new Date();
  const dateStr = generated.toLocaleString(undefined, { dateStyle: 'long', timeStyle: 'short' });

  const ensureSpace = (needed) => {
    if (y + needed > pageH - margin) { doc.addPage(); y = margin; }
  };

  const heading = (text) => {
    ensureSpace(38);
    y += 8;
    doc.setFillColor(...PRIMARY);
    doc.rect(margin, y - 9, 3.5, 13, 'F');
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(13);
    doc.setTextColor(...NAVY);
    doc.text(text, margin + 10, y);
    y += 16;
  };

  const paragraph = (text, opts = {}) => {
    if (!text) return;
    const size = opts.size || 10;
    doc.setFont('helvetica', opts.bold ? 'bold' : 'normal');
    doc.setFontSize(size);
    doc.setTextColor(...(opts.color || BODY));
    const clean = String(text).replace(/[*_#`]/g, '');
    doc.splitTextToSize(clean, opts.width || contentW).forEach((line) => {
      ensureSpace(size + 4);
      doc.text(line, opts.x || margin, y);
      y += size + 4;
    });
  };

  // ---- Cover band ----
  doc.setFillColor(...NAVY);
  doc.rect(0, 0, pageW, 118, 'F');
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(20);
  doc.setTextColor(255, 255, 255);
  doc.text('Strategy Status Report', margin, 52);
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(11);
  doc.setTextColor(203, 213, 225);
  doc.text(strategy.title || orgName, margin, 74);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(10);
  doc.setTextColor(255, 255, 255);
  doc.text(`As at ${dateStr}`, margin, 91);
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9);
  doc.setTextColor(203, 213, 225);
  doc.text(`${orgName} · Point-in-time snapshot · Owner ${strategy.owner || '—'}`, margin, 105);
  y = 148;

  // ---- Metric tiles ----
  const tiles = [
    { label: 'Total Items', value: String(overall.total ?? 0) },
    { label: 'Completion', value: `${overall.completion_rate ?? 0}%` },
    { label: 'At Risk', value: String(overall.at_risk ?? 0) },
    { label: 'Overdue', value: String(overall.overdue ?? 0) },
  ];
  const gap = 12;
  const tileW = (contentW - gap * 3) / 4;
  tiles.forEach((tile, i) => {
    const x = margin + i * (tileW + gap);
    doc.setFillColor(...LIGHT);
    doc.roundedRect(x, y, tileW, 56, 6, 6, 'F');
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(18);
    doc.setTextColor(...PRIMARY);
    doc.text(tile.value, x + 12, y + 28);
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8);
    doc.setTextColor(...MUTED);
    doc.text(tile.label.toUpperCase(), x + 12, y + 44);
  });
  y += 82;

  // ---- Hierarchy table ----
  if (metrics.layers?.length) {
    heading('Hierarchy Snapshot');
    const cols = [
      { w: contentW * 0.34, label: 'Layer' },
      { w: contentW * 0.14, label: 'Items' },
      { w: contentW * 0.18, label: 'Completed' },
      { w: contentW * 0.17, label: 'Avg Progress' },
      { w: contentW * 0.17, label: 'Off Track' },
    ];
    ensureSpace(26);
    doc.setFillColor(...NAVY);
    doc.rect(margin, y - 11, contentW, 18, 'F');
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(8.5);
    doc.setTextColor(255, 255, 255);
    let cx = margin + 6;
    cols.forEach((c) => { doc.text(c.label.toUpperCase(), cx, y); cx += c.w; });
    y += 14;
    doc.setFontSize(9);
    metrics.layers.forEach((layer, idx) => {
      ensureSpace(20);
      if (idx % 2 === 0) { doc.setFillColor(...LIGHT); doc.rect(margin, y - 10, contentW, 18, 'F'); }
      const cells = [
        layer.name,
        String(layer.total),
        `${layer.completed} (${layer.completion_rate}%)`,
        `${layer.avg_progress}%`,
        String(layer.health?.['Off Track'] ?? 0),
      ];
      cx = margin + 6;
      doc.setFont('helvetica', 'normal');
      doc.setTextColor(...BODY);
      cells.forEach((text, i) => {
        doc.text(doc.splitTextToSize(text, cols[i].w - 8)[0] || '—', cx, y);
        cx += cols[i].w;
      });
      y += 18;
    });
    y += 6;
  }

  // ---- Performance measures table ----
  if (metrics.measures?.length) {
    heading('Performance Measures');
    const mCols = [
      { w: contentW * 0.36, label: 'Measure' },
      { w: contentW * 0.14, label: 'Current' },
      { w: contentW * 0.14, label: 'Target' },
      { w: contentW * 0.14, label: 'Gap' },
      { w: contentW * 0.22, label: 'Current Position' },
    ];
    ensureSpace(26);
    doc.setFillColor(...NAVY);
    doc.rect(margin, y - 11, contentW, 18, 'F');
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(8.5);
    doc.setTextColor(255, 255, 255);
    let mx = margin + 6;
    mCols.forEach((c) => { doc.text(c.label.toUpperCase(), mx, y); mx += c.w; });
    y += 14;
    doc.setFontSize(9);
    metrics.measures.forEach((m, idx) => {
      ensureSpace(20);
      if (idx % 2 === 0) { doc.setFillColor(...LIGHT); doc.rect(margin, y - 10, contentW, 18, 'F'); }
      const cells = [
        `${m.custom_id ? `${m.custom_id} · ` : ''}${m.title}`,
        formatMeasureValue(m.current_value, m.unit),
        formatMeasureValue(m.target, m.unit),
        formatGap(m.gap, m.unit),
        POSITION_LABEL[m.current_position] || POSITION_LABEL.no_data,
      ];
      mx = margin + 6;
      doc.setFont('helvetica', 'normal');
      cells.forEach((text, i) => {
        const isPosition = i === cells.length - 1;
        doc.setTextColor(...(isPosition ? (POSITION_RGB[m.current_position] || POSITION_RGB.no_data) : BODY));
        doc.setFont('helvetica', isPosition ? 'bold' : 'normal');
        doc.text(doc.splitTextToSize(String(text), mCols[i].w - 8)[0] || '—', mx, y);
        mx += mCols[i].w;
      });
      y += 18;
    });
    y += 6;
  }

  // ---- Narrative sections ----
  reportSections(report).forEach((section) => {
    const value = narrative[section.field];
    const isEmpty = value == null || value === '' || (Array.isArray(value) && !value.length);
    if (isEmpty) return;
    heading(section.title);

    if (section.id === 'executive_summary' && narrative.status_statement) {
      paragraph(narrative.status_statement, { bold: true, color: NAVY, size: 10.5 });
      y += 4;
    }
    if (section.id === 'overall_status' && narrative.overall_rating) {
      paragraph(`Overall rating: ${RATING_LABEL[narrative.overall_rating] || narrative.overall_rating}`, {
        bold: true,
        color: RATING_RGB[narrative.overall_rating] || NAVY,
      });
      y += 2;
    }

    if (section.field === 'level_breakdown') {
      value.forEach((entry) => {
        paragraph(`${entry.label} — ${RATING_LABEL[entry.status] || entry.status || ''}`, {
          bold: true,
          color: RATING_RGB[entry.status] || NAVY,
        });
        paragraph(entry.assessment, { x: margin + 14, width: contentW - 14, color: MUTED });
        y += 2;
      });
      return;
    }
    if (FINDING_FIELDS.includes(section.field)) {
      value.forEach((finding) => {
        ensureSpace(20);
        doc.setFillColor(...(SEVERITY_RGB[finding.severity] || SEVERITY_RGB.info));
        doc.circle(margin + 3, y - 3, 3, 'F');
        paragraph(finding.title, { bold: true, color: NAVY, x: margin + 14, width: contentW - 14 });
        paragraph(finding.detail, { x: margin + 14, width: contentW - 14, color: MUTED });
        y += 2;
      });
      return;
    }
    if (STRING_ARRAY_FIELDS.includes(section.field)) {
      value.forEach((item, i) => { paragraph(`${i + 1}. ${item}`); y += 2; });
      return;
    }
    paragraph(value);
    y += 4;
  });

  // ---- Footer ----
  const pages = doc.internal.getNumberOfPages();
  for (let p = 1; p <= pages; p += 1) {
    doc.setPage(p);
    doc.setDrawColor(...LIGHT);
    doc.line(margin, pageH - 30, pageW - margin, pageH - 30);
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(7.5);
    doc.setTextColor(...MUTED);
    doc.text('Strategy Status Report — Confidential, prepared for the Board and Executive', margin, pageH - 18);
    doc.text(`Page ${p} of ${pages}`, pageW - margin, pageH - 18, { align: 'right' });
  }

  const slug = (strategy.title || 'Strategy').replace(/[^a-z0-9]+/gi, '-').slice(0, 40);
  doc.save(`Strategy-Status-Report-${slug}-${toLocalISODate(generated)}.pdf`);
}

export { REPORT_SECTIONS };