import { exportRegisterPdf } from '@/lib/export/registerPdf';
import { exportRegisterExcel } from '@/lib/export/registerExcel';
import { text, badge, person, progress, caption, DASH, stripHtml } from '@/lib/export/registerCells';
import { formatReviewDate } from '@/lib/reviewDateUtils';
import { isActionOverdue, actionSummaryCounts } from '@/lib/actionRegisterHelpers';
import { PRIORITY_STYLES, STATUS_STYLES, TREATMENT_STYLES } from '@/components/risk/steps/treatmentConstants';

// Mirrors the visible columns (and widths) of ActionRegisterGrid.
const COLUMNS = [
  { key: 'description', label: 'Risk Treatments', width: 404 },
  { key: 'owner', label: 'Treatment Owner', width: 120 },
  { key: 'due_date', label: 'Due Date', width: 104 },
  { key: 'risk_treatment_strategy', label: 'Treatment Strategy', width: 130 },
  { key: 'status', label: 'Status', width: 100 },
  { key: 'priority', label: 'Priority', width: 90 },
  { key: 'progress', label: 'Treatment Progress %', width: 130 },
];

const cellFor = (a, key) => {
  switch (key) {
    case 'description': {
      const lines = [[text(a.title || '—', { bold: true })]];
      const desc = stripHtml(a.description);
      if (desc) lines.push([text(desc, { muted: true, size: 6.8 })]);
      if (a.risk_title) lines.push([caption('Risk:'), text(a.risk_title, { muted: true, size: 6.5 })]);
      return lines;
    }
    case 'owner':
      return [[a.owner ? person(a.owner) : DASH]];
    case 'due_date': {
      if (a.resolve_by === 'On Going') return [[text('On Going', { muted: true })]];
      if (!a.due_date) return [[DASH]];
      const overdue = isActionOverdue(a);
      const lines = [[text(formatReviewDate(a.due_date), { danger: overdue, bold: overdue })]];
      if (overdue) lines.push([text('Overdue', { danger: true, size: 6.5 })]);
      return lines;
    }
    case 'risk_treatment_strategy':
      return a.risk_treatment_strategy
        ? [[badge(a.risk_treatment_strategy, TREATMENT_STYLES[a.risk_treatment_strategy] || 'bg-muted text-muted-foreground')]]
        : [[DASH]];
    case 'status':
      return a.status ? [[badge(a.status, STATUS_STYLES[a.status] || 'bg-muted text-muted-foreground')]] : [[DASH]];
    case 'priority':
      return a.priority ? [[badge(a.priority, PRIORITY_STYLES[a.priority] || 'bg-muted text-muted-foreground')]] : [[DASH]];
    case 'progress':
      return [[progress(a.progress || 0)]];
    default:
      return [];
  }
};

function summaryFor(actions) {
  const c = actionSummaryCounts(actions);
  return [
    { value: c.total, label: 'Total Risk Treatments' },
    { value: c.overdue, label: 'Overdue Treatments' },
    { value: c.highPriority, label: 'High Priority Treatments' },
    { value: `${c.completionPct}%`, label: 'Treatment Completion Rate' },
  ];
}

const buildOpts = (actions, title, statusLabel) => ({
  title,
  statusLabel,
  summary: summaryFor(actions),
  columns: COLUMNS,
  rows: actions,
  cellFor,
});

const EXCEL_COLUMNS = [
  { label: 'Treatment Title', value: (a) => a.title || '' },
  { label: 'Treatment Description', value: (a) => stripHtml(a.description) },
  { label: 'Related Risk', value: (a) => a.risk_title || '' },
  { label: 'Treatment Owner', value: (a) => a.owner || '' },
  { label: 'Due Date', value: (a) => (a.resolve_by === 'On Going' ? 'On Going' : a.due_date ? formatReviewDate(a.due_date) : '') },
  { label: 'Treatment Strategy', value: (a) => a.risk_treatment_strategy || '' },
  { label: 'Status', value: (a) => a.status || '' },
  { label: 'Priority', value: (a) => a.priority || '' },
  { label: 'Treatment Progress %', value: (a) => a.progress || 0 },
];

export function exportToExcel(actions, title = 'Treatment Register') {
  exportRegisterExcel({ title, sheetName: 'Treatments', columns: EXCEL_COLUMNS, rows: actions });
}

export function exportToPdf(actions, title = 'Treatment Register', statusLabel = 'All Treatments') {
  exportRegisterPdf(buildOpts(actions, title, statusLabel));
}