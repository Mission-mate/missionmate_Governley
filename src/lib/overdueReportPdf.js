import jsPDF from 'jspdf';
import { toLocalISODate } from '@/lib/localClock';
import { selectedSections } from '@/lib/riskReportSections';

const NAVY = [30, 41, 59];
const PRIMARY = [37, 99, 235];
const MUTED = [100, 116, 139];
const LIGHT = [241, 245, 249];
const RED = [220, 38, 38];

const RATING_RGB = {
  'Very Low': [132, 204, 22],
  Low: [22, 163, 74],
  Tolerable: [250, 204, 21],
  High: [249, 115, 22],
  'Very High': [220, 38, 38],
};

const SEVERITY_RGB = {
  info: [37, 99, 235],
  warning: [217, 119, 6],
  critical: [220, 38, 38],
};

/**
 * Build a board-ready PDF for an overdue-risks or overdue-treatments snapshot.
 * `reportType` supplies the title/wording; `columns` defines the detail table.
 */
export function downloadOverdueReportPdf(snapshot, reportType, orgName = 'Organisation') {
  const doc = new jsPDF({ unit: 'pt', format: 'a4' });
  const pageW = doc.internal.pageSize.getWidth();
  const pageH = doc.internal.pageSize.getHeight();
  const margin = 48;
  const contentW = pageW - margin * 2;
  let y = margin;

  const { metrics = {}, items = [], narrative = {} } = snapshot || {};
  const generated = snapshot?.generated_at ? new Date(snapshot.generated_at) : new Date();
  const dateStr = generated.toLocaleString(undefined, { dateStyle: 'long', timeStyle: 'short' });
  const isTreatment = reportType.id === 'overdue_treatments';
  const chosen = selectedSections(snapshot, reportType.id);
  const enabled = (id) => chosen.includes(id);

  const ensureSpace = (needed) => {
    if (y + needed > pageH - margin) { doc.addPage(); y = margin; }
  };

  const heading = (text) => {
    ensureSpace(34);
    y += 6;
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
    const color = opts.color || [51, 65, 85];
    doc.setFont('helvetica', opts.bold ? 'bold' : 'normal');
    doc.setFontSize(size);
    doc.setTextColor(...color);
    const clean = String(text).replace(/[*_#`]/g, '');
    const lines = doc.splitTextToSize(clean, opts.width || contentW);
    lines.forEach((ln) => {
      ensureSpace(size + 4);
      doc.text(ln, opts.x || margin, y);
      y += size + 4;
    });
  };

  // ---- Cover header band ----
  doc.setFillColor(...NAVY);
  doc.rect(0, 0, pageW, 110, 'F');
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(20);
  doc.setTextColor(255, 255, 255);
  doc.text(reportType.label, margin, 56);
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(11);
  doc.setTextColor(203, 213, 225);
  doc.text(orgName, margin, 76);
  doc.setFontSize(9);
  doc.text(`Point-in-time assessment · Generated ${dateStr}`, margin, 92);
  y = 140;

  // ---- Key metrics tiles ----
  const tiles = isTreatment
    ? [
        { label: 'Overdue Actions', value: String(metrics.total ?? 0) },
        { label: 'Risks Affected', value: String(metrics.affectedRisks ?? 0) },
        { label: 'On Critical Risks', value: String(metrics.criticalCount ?? 0) },
        { label: 'Max Days Overdue', value: String(metrics.maxOverdue ?? 0) },
      ]
    : [
        { label: 'Overdue Risks', value: String(metrics.total ?? 0) },
        { label: 'Critically Rated', value: String(metrics.criticalCount ?? 0) },
        { label: 'Outside Appetite', value: String(metrics.outsideAppetite ?? 0) },
        { label: 'Max Days Overdue', value: String(metrics.maxOverdue ?? 0) },
      ];
  const gap = 12;
  const tileW = (contentW - gap * 3) / 4;
  tiles.forEach((t, i) => {
    const x = margin + i * (tileW + gap);
    doc.setFillColor(...LIGHT);
    doc.roundedRect(x, y, tileW, 56, 6, 6, 'F');
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(18);
    doc.setTextColor(...PRIMARY);
    doc.text(t.value, x + 12, y + 28);
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(7.5);
    doc.setTextColor(...MUTED);
    doc.text(t.label.toUpperCase(), x + 12, y + 44);
  });
  y += 80;

  // ---- Executive summary ----
  if (enabled('executive_summary')) {
    heading('Executive Summary');
    if (narrative.risk_posture_statement) {
      paragraph(narrative.risk_posture_statement, { bold: true, color: NAVY, size: 10.5 });
      y += 4;
    }
    paragraph(narrative.executive_summary);
    y += 6;
  }

  // ---- Key themes ----
  if (enabled('key_themes') && narrative.key_themes?.length) {
    heading('Key Themes');
    narrative.key_themes.forEach((t) => {
      paragraph(`• ${t.title}`, { bold: true, color: NAVY });
      if (t.detail) paragraph(t.detail, { x: margin + 14, width: contentW - 14, color: MUTED });
      y += 2;
    });
  }

  // ---- Detail table ----
  if (enabled('overdue_items') && items.length) {
    heading(isTreatment ? 'Overdue Treatment Actions' : 'Overdue Risks');
    const cols = isTreatment
      ? [
          { key: 'action', w: contentW * 0.34, label: 'Action' },
          { key: 'risk_title', w: contentW * 0.24, label: 'Risk' },
          { key: 'residual_rating', w: contentW * 0.16, label: 'Rating' },
          { key: 'priority', w: contentW * 0.12, label: 'Priority' },
          { key: 'days_overdue', w: contentW * 0.14, label: 'Overdue', num: true },
        ]
      : [
          { key: 'title', w: contentW * 0.36, label: 'Risk' },
          { key: 'residual_rating', w: contentW * 0.16, label: 'Rating' },
          { key: 'appetite', w: contentW * 0.18, label: 'Appetite' },
          { key: 'owner', w: contentW * 0.16, label: 'Owner' },
          { key: 'days_overdue', w: contentW * 0.14, label: 'Overdue', num: true },
        ];

    const headerRow = () => {
      doc.setFillColor(...NAVY);
      doc.rect(margin, y - 11, contentW, 18, 'F');
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(8.5);
      doc.setTextColor(255, 255, 255);
      let cx = margin + 6;
      cols.forEach((c) => { doc.text(c.label.toUpperCase(), cx, y); cx += c.w; });
      y += 14;
    };
    ensureSpace(24);
    headerRow();

    items.forEach((it, idx) => {
      if (y + 18 > pageH - margin) { doc.addPage(); y = margin; ensureSpace(24); headerRow(); }
      if (idx % 2 === 0) {
        doc.setFillColor(...LIGHT);
        doc.rect(margin, y - 10, contentW, 18, 'F');
      }
      let cx = margin + 6;
      cols.forEach((c) => {
        let val = it[c.key];
        if (c.num) val = `${val} days`;
        if (c.key === 'residual_rating') {
          doc.setTextColor(...(RATING_RGB[it.residual_rating] || MUTED));
          doc.setFont('helvetica', 'bold');
        } else if (c.num) {
          doc.setTextColor(...RED);
          doc.setFont('helvetica', 'bold');
        } else {
          doc.setTextColor(51, 65, 85);
          doc.setFont('helvetica', 'normal');
        }
        doc.setFontSize(9);
        const txt = doc.splitTextToSize(String(val ?? '—'), c.w - 8)[0] || '—';
        doc.text(txt, cx, y);
        cx += c.w;
      });
      y += 18;
    });
    y += 6;
    if (narrative.top_risks_commentary) paragraph(narrative.top_risks_commentary, { color: MUTED });
  }

  const extraSections = [
    ['risk_appetite', 'Risk Appetite Assessment', 'risk_appetite_assessment'],
    ['category_analysis', 'Risk by Category', 'category_analysis'],
    ['treatment_progress', 'Treatment Action Progress', 'treatment_progress'],
    ['control_effectiveness', 'Control Effectiveness Review', 'control_effectiveness'],
    ['review_cadence', 'Review Cadence & Overdue Reviews', 'review_cadence'],
    ['owner_accountability', 'Risk Owner Accountability', 'owner_accountability'],
  ];
  extraSections.forEach(([id, title, field]) => {
    if (enabled(id) && narrative[field]) { heading(title); paragraph(narrative[field]); }
  });

  // ---- Governance findings ----
  if (enabled('governance') && narrative.governance_findings?.length) {
    heading('Findings');
    narrative.governance_findings.forEach((f) => {
      ensureSpace(20);
      doc.setFillColor(...(SEVERITY_RGB[f.severity] || SEVERITY_RGB.info));
      doc.circle(margin + 3, y - 3, 3, 'F');
      paragraph(f.title, { bold: true, color: NAVY, x: margin + 14, width: contentW - 14 });
      if (f.detail) paragraph(f.detail, { x: margin + 14, width: contentW - 14, color: MUTED });
      y += 2;
    });
  }

  // ---- Recommendations ----
  if (enabled('recommendations') && narrative.recommendations?.length) {
    heading('Recommendations');
    narrative.recommendations.forEach((r, i) => { paragraph(`${i + 1}. ${r}`, { width: contentW }); y += 2; });
  }

  // ---- Outlook ----
  if (enabled('outlook') && narrative.outlook) { heading('Outlook'); paragraph(narrative.outlook); }

  // ---- Footer on every page ----
  const pages = doc.internal.getNumberOfPages();
  for (let p = 1; p <= pages; p++) {
    doc.setPage(p);
    doc.setDrawColor(...LIGHT);
    doc.line(margin, pageH - 30, pageW - margin, pageH - 30);
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(7.5);
    doc.setTextColor(...MUTED);
    doc.text(`${reportType.label} — Confidential, prepared for the Executive Board`, margin, pageH - 18);
    doc.text(`Page ${p} of ${pages}`, pageW - margin, pageH - 18, { align: 'right' });
  }

  doc.save(`${reportType.label.replace(/\s+/g, '-')}-${toLocalISODate(generated)}.pdf`);
}