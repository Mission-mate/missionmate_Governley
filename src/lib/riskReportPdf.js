import jsPDF from 'jspdf';
import { toLocalISODate } from '@/lib/localClock';
import { selectedSections } from '@/lib/riskReportSections';

const NAVY = [30, 41, 59];
const PRIMARY = [37, 99, 235];
const MUTED = [100, 116, 139];
const LIGHT = [241, 245, 249];

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
 * Build a board-ready PDF from a saved risk report snapshot and trigger a download.
 */
export function downloadRiskReportPdf(snapshot, orgName = 'Organisation') {
  const doc = new jsPDF({ unit: 'pt', format: 'a4' });
  const pageW = doc.internal.pageSize.getWidth();
  const pageH = doc.internal.pageSize.getHeight();
  const margin = 48;
  const contentW = pageW - margin * 2;
  let y = margin;

  const { metrics = {}, topRisks = [], narrative = {} } = snapshot || {};
  const chosen = selectedSections(snapshot, 'comprehensive');
  const enabled = (id) => chosen.includes(id);
  const generated = snapshot?.generated_at ? new Date(snapshot.generated_at) : new Date();
  const dateStr = generated.toLocaleString(undefined, { dateStyle: 'long', timeStyle: 'short' });

  const ensureSpace = (needed) => {
    if (y + needed > pageH - margin) {
      doc.addPage();
      y = margin;
    }
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
  doc.text('Comprehensive Risk Report', margin, 56);
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(11);
  doc.setTextColor(203, 213, 225);
  doc.text(orgName, margin, 76);
  doc.setFontSize(9);
  doc.text(`Point-in-time snapshot · Generated ${dateStr}`, margin, 92);
  y = 140;

  // ---- Key metrics tiles ----
  const tiles = [
    { label: 'Total Risks', value: String(metrics.total ?? 0) },
    { label: 'Active', value: String(metrics.active ?? 0) },
    { label: 'Outside Appetite', value: String(metrics.outsideAppetite ?? 0) },
    { label: 'Risk Reduction', value: `${metrics.riskReduction ?? 0}%` },
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
    doc.setFontSize(8);
    doc.setTextColor(...MUTED);
    doc.text(t.label.toUpperCase(), x + 12, y + 44);
  });
  y += 80;

  // ---- Residual rating distribution bar ----
  heading('Residual Risk Profile');
  const rc = metrics.ratingCounts || {};
  const order = ['Very Low', 'Low', 'Tolerable', 'High', 'Very High'];
  const totalRated = order.reduce((s, k) => s + (rc[k] || 0), 0) || 1;
  let barX = margin;
  const barY = y;
  const barH = 18;
  order.forEach((k) => {
    const w = ((rc[k] || 0) / totalRated) * contentW;
    if (w <= 0) return;
    doc.setFillColor(...(RATING_RGB[k] || MUTED));
    doc.rect(barX, barY, w, barH, 'F');
    barX += w;
  });
  y += barH + 14;
  // legend
  doc.setFontSize(8);
  let lx = margin;
  order.forEach((k) => {
    doc.setFillColor(...(RATING_RGB[k] || MUTED));
    doc.rect(lx, y - 7, 8, 8, 'F');
    doc.setTextColor(...MUTED);
    doc.setFont('helvetica', 'normal');
    doc.text(`${k} (${rc[k] || 0})`, lx + 12, y);
    lx += doc.getTextWidth(`${k} (${rc[k] || 0})`) + 30;
  });
  y += 18;

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
    heading('Key Strategic Themes');
    narrative.key_themes.forEach((t) => {
      paragraph(`• ${t.title}`, { bold: true, color: NAVY });
      if (t.detail) paragraph(t.detail, { x: margin + 14, width: contentW - 14, color: MUTED });
      y += 2;
    });
  }

  // ---- Top risks table ----
  if (enabled('top_risks') && topRisks.length) {
    heading('Top Residual Risks');
    const cols = [
      { key: 'title', w: contentW * 0.42, label: 'Risk' },
      { key: 'category', w: contentW * 0.2, label: 'Category' },
      { key: 'owner', w: contentW * 0.18, label: 'Owner' },
      { key: 'residual_rating', w: contentW * 0.2, label: 'Residual' },
    ];
    ensureSpace(24);
    doc.setFillColor(...NAVY);
    doc.rect(margin, y - 11, contentW, 18, 'F');
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(8.5);
    doc.setTextColor(255, 255, 255);
    let cx = margin + 6;
    cols.forEach((c) => { doc.text(c.label.toUpperCase(), cx, y); cx += c.w; });
    y += 14;
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(9);
    topRisks.forEach((r, idx) => {
      ensureSpace(20);
      if (idx % 2 === 0) {
        doc.setFillColor(...LIGHT);
        doc.rect(margin, y - 10, contentW, 18, 'F');
      }
      cx = margin + 6;
      cols.forEach((c) => {
        if (c.key === 'residual_rating') {
          const col = RATING_RGB[r.residual_rating] || MUTED;
          doc.setTextColor(...col);
          doc.setFont('helvetica', 'bold');
        } else {
          doc.setTextColor(51, 65, 85);
          doc.setFont('helvetica', 'normal');
        }
        const txt = doc.splitTextToSize(String(r[c.key] ?? '—'), c.w - 8)[0] || '—';
        doc.text(txt, cx, y);
        cx += c.w;
      });
      y += 18;
    });
    y += 6;
    if (narrative.top_risks_commentary) {
      paragraph(narrative.top_risks_commentary, { color: MUTED });
    }
  }

  const extraSections = [
    ['risk_appetite', 'Risk Appetite Assessment', 'risk_appetite_assessment'],
    ['category_analysis', 'Risk by Category', 'category_analysis'],
    ['inherent_residual', 'Inherent vs Residual Analysis', 'inherent_residual_analysis'],
    ['treatment_progress', 'Treatment Action Progress', 'treatment_progress'],
    ['control_effectiveness', 'Control Effectiveness Review', 'control_effectiveness'],
    ['review_cadence', 'Review Cadence & Overdue Reviews', 'review_cadence'],
    ['owner_accountability', 'Risk Owner Accountability', 'owner_accountability'],
    ['rating_trends', 'Rating Trend & Movements', 'rating_trends'],
    ['closed_risks', 'Closed Risks Summary', 'closed_risks'],
  ];
  extraSections.forEach(([id, title, field]) => {
    if (enabled(id) && narrative[field]) { heading(title); paragraph(narrative[field]); }
  });

  // ---- Governance findings ----
  if (enabled('governance') && narrative.governance_findings?.length) {
    heading('Governance & Compliance Findings');
    narrative.governance_findings.forEach((f) => {
      ensureSpace(20);
      const col = SEVERITY_RGB[f.severity] || SEVERITY_RGB.info;
      doc.setFillColor(...col);
      doc.circle(margin + 3, y - 3, 3, 'F');
      paragraph(f.title, { bold: true, color: NAVY, x: margin + 14, width: contentW - 14 });
      if (f.detail) paragraph(f.detail, { x: margin + 14, width: contentW - 14, color: MUTED });
      y += 2;
    });
  }

  // ---- Recommendations ----
  if (enabled('recommendations') && narrative.recommendations?.length) {
    heading('Recommendations for the Board');
    narrative.recommendations.forEach((r, i) => {
      paragraph(`${i + 1}. ${r}`, { x: margin, width: contentW });
      y += 2;
    });
  }

  // ---- Outlook ----
  if (enabled('outlook') && narrative.outlook) {
    heading('Outlook');
    paragraph(narrative.outlook);
  }

  // ---- Footer on every page ----
  const pages = doc.internal.getNumberOfPages();
  for (let p = 1; p <= pages; p++) {
    doc.setPage(p);
    doc.setDrawColor(...LIGHT);
    doc.line(margin, pageH - 30, pageW - margin, pageH - 30);
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(7.5);
    doc.setTextColor(...MUTED);
    doc.text('Comprehensive Risk Report — Confidential, prepared for the Executive Board', margin, pageH - 18);
    doc.text(`Page ${p} of ${pages}`, pageW - margin, pageH - 18, { align: 'right' });
  }

  doc.save(`Comprehensive-Risk-Report-${toLocalISODate(generated)}.pdf`);
}