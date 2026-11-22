import { exportRegisterPdf } from '@/lib/export/registerPdf';
import { exportRegisterExcel } from '@/lib/export/registerExcel';
import { text, badge, person, caption, DASH } from '@/lib/export/registerCells';
import { formatReviewDate, isReviewOverdue, summaryCounts } from '@/lib/riskRegisterHelpers';
import { RATING_STYLES } from '@/lib/riskMatrix';
import { getAppetiteStyle } from '@/components/risk/detail/statusStyles';
import { TREATMENT_STYLES } from '@/components/risk/steps/treatmentConstants';
import { OPTION_COLORS } from '@/lib/registerColors';
import { stripHtml } from '@/lib/export/registerCells';

// Mirrors the visible columns (and widths) of RiskRegisterGrid.
const COLUMNS = [
  { key: 'risk_id', label: 'Risk ID', width: 70 },
  { key: 'title', label: 'Risk Title', width: 420 },
  { key: 'residual_rating', label: 'Risk Rating', width: 112 },
  { key: 'risk_appetite', label: 'Risk Appetite', width: 128 },
  { key: 'treatment_action', label: 'Treatment Strategy', width: 168 },
  { key: 'review_frequency', label: 'Review Frequency', width: 140 },
  { key: 'last_reviewed_date', label: 'Last Review', width: 92 },
  { key: 'next_review_date', label: 'Next Review', width: 92 },
];

const categoryClasses = (value, options = []) => {
  const opt = (options || []).find((o) => (typeof o === 'object' ? o.name : o) === value);
  const def = OPTION_COLORS.find((c) => c.id === opt?.color);
  return def ? `${def.bg} ${def.text}` : 'bg-muted text-muted-foreground';
};

const ratingClasses = (rating) => {
  const s = RATING_STYLES[rating];
  return s ? `${s.bg} ${s.text}` : 'bg-muted text-muted-foreground';
};

function makeCellFor(categoryOptions) {
  return (risk, key) => {
    switch (key) {
      case 'risk_id':
        return [[text(risk.risk_id || '—', { muted: true, size: 7 })]];
      case 'title': {
        const lines = [[text(risk.title || '—', { bold: true })]];
        const desc = stripHtml(risk.description);
        if (desc) lines.push([text(desc, { muted: true, size: 6.8 })]);
        const sub = [];
        if (risk.category) sub.push(caption('Risk Category:'), badge(risk.category, categoryClasses(risk.category, categoryOptions)));
        if (risk.owner) sub.push(caption('Risk Owner:'), person(risk.owner));
        if (sub.length) lines.push(sub);
        return lines;
      }
      case 'residual_rating':
        return risk.residual_rating ? [[badge(risk.residual_rating, ratingClasses(risk.residual_rating))]] : [[DASH]];
      case 'risk_appetite':
        return risk.risk_appetite ? [[badge(risk.risk_appetite, getAppetiteStyle(risk.risk_appetite))]] : [[DASH]];
      case 'treatment_action':
        return risk.treatment_action
          ? [[badge(risk.treatment_action, TREATMENT_STYLES[risk.treatment_action] || 'bg-muted text-muted-foreground')]]
          : [[DASH]];
      case 'review_frequency':
        return [[text(
          risk.review_frequency === 'Every' && risk.interval_value
            ? `Every ${risk.interval_value} ${risk.interval_unit || 'Months'}`
            : risk.review_frequency || '—'
        )]];
      case 'last_reviewed_date':
        return [[risk.last_reviewed_date ? text(formatReviewDate(risk.last_reviewed_date)) : DASH]];
      case 'next_review_date': {
        if (!risk.next_review_date) return [[DASH]];
        const overdue = isReviewOverdue(risk);
        const lines = [[text(formatReviewDate(risk.next_review_date), { danger: overdue, bold: overdue })]];
        if (overdue) lines.push([text('Overdue', { danger: true, size: 6.5 })]);
        return lines;
      }
      default:
        return [];
    }
  };
}

function summaryFor(risks) {
  const c = summaryCounts(risks);
  return [
    { value: c.total, label: 'Total Risks' },
    { value: c.critical, label: 'Critical Risks' },
    { value: c.high, label: 'High Risks' },
    { value: c.dueForReview, label: 'Risks Due for Review' },
  ];
}

const buildOpts = (risks, title, statusLabel, categoryOptions) => ({
  title,
  statusLabel,
  summary: summaryFor(risks),
  columns: COLUMNS,
  rows: risks,
  cellFor: makeCellFor(categoryOptions),
});

const reviewFrequencyText = (r) =>
  r.review_frequency === 'Every' && r.interval_value
    ? `Every ${r.interval_value} ${r.interval_unit || 'Months'}`
    : r.review_frequency || '';

const EXCEL_COLUMNS = [
  { label: 'Risk ID', value: (r) => r.risk_id || '' },
  { label: 'Risk Title', value: (r) => r.title || '' },
  { label: 'Risk Description', value: (r) => stripHtml(r.description) },
  { label: 'Risk Category', value: (r) => r.category || '' },
  { label: 'Risk Owner', value: (r) => r.owner || '' },
  { label: 'Risk Rating', value: (r) => r.residual_rating || '' },
  { label: 'Risk Appetite', value: (r) => r.risk_appetite || '' },
  { label: 'Treatment Strategy', value: (r) => r.treatment_action || '' },
  { label: 'Review Frequency', value: reviewFrequencyText },
  { label: 'Last Review', value: (r) => (r.last_reviewed_date ? formatReviewDate(r.last_reviewed_date) : '') },
  { label: 'Next Review', value: (r) => (r.next_review_date ? formatReviewDate(r.next_review_date) : '') },
];

export function exportToExcel(risks, title = 'Risk Register') {
  exportRegisterExcel({ title, sheetName: 'Risks', columns: EXCEL_COLUMNS, rows: risks });
}

export function exportToPdf(risks, title = 'Risk Register', statusLabel = 'All Risks', categoryOptions = []) {
  exportRegisterPdf(buildOpts(risks, title, statusLabel, categoryOptions));
}