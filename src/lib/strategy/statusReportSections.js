/**
 * Selectable sections and length presets for the AI Strategy Status Report.
 * Mirrors base44/shared/strategyReportConfig.ts (which the backend uses).
 */

export const REPORT_SECTIONS = [
  { id: 'executive_summary', label: 'Executive Summary', field: 'executive_summary', title: 'Executive Summary' },
  { id: 'overall_status', label: 'Overall Status', field: 'overall_status', title: 'Overall Status' },
  { id: 'level_breakdown', label: 'Hierarchy Breakdown', field: 'level_breakdown', title: 'Hierarchy Breakdown' },
  { id: 'health_analysis', label: 'Health Analysis', field: 'health_analysis', title: 'Health Analysis' },
  { id: 'delivery_status', label: 'Delivery Status', field: 'delivery_status', title: 'Delivery Status' },
  { id: 'progress_analysis', label: 'Progress Analysis', field: 'progress_analysis', title: 'Progress Analysis' },
  { id: 'performance_measures', label: 'Performance Measures', field: 'performance_measures', title: 'Performance Measures' },
  { id: 'overdue_items', label: 'Overdue Items', field: 'overdue_analysis', title: 'Overdue Items' },
  { id: 'upcoming_milestones', label: 'Upcoming Milestones', field: 'upcoming_milestones', title: 'Upcoming Milestones' },
  { id: 'priority_analysis', label: 'Priority Analysis', field: 'priority_analysis', title: 'Priority Analysis' },
  { id: 'ownership_accountability', label: 'Ownership & Accountability', field: 'ownership_accountability', title: 'Ownership & Accountability' },
  { id: 'contribution_alignment', label: 'Strategic Alignment', field: 'contribution_alignment', title: 'Strategic Alignment' },
  { id: 'data_quality', label: 'Data Quality', field: 'data_quality_findings', title: 'Data Quality Findings' },
  { id: 'gaps', label: 'Gaps', field: 'gaps', title: 'Gaps' },
  { id: 'opportunities', label: 'Opportunities', field: 'opportunities', title: 'Opportunities' },
  { id: 'risks_and_blockers', label: 'Risks & Blockers', field: 'risks_and_blockers', title: 'Risks & Blockers' },
  { id: 'recommendations', label: 'Recommendations', field: 'recommendations', title: 'Recommendations' },
  { id: 'outlook', label: 'Outlook', field: 'outlook', title: 'Outlook' },
];

export const LENGTH_PRESETS = {
  concise: { label: 'Concise', description: 'Short, decision-focused summary of the essentials.' },
  standard: { label: 'Standard', description: 'Balanced board report across the core sections.' },
  detailed: { label: 'Detailed', description: 'Full evidence-based analysis across every section.' },
};

const CORE = ['executive_summary', 'overall_status', 'level_breakdown', 'health_analysis', 'progress_analysis', 'recommendations'];

/** Sensible default selection for each length preset. */
export function defaultSections(length) {
  if (length === 'concise') return ['executive_summary', 'overall_status', 'health_analysis', 'recommendations'];
  if (length === 'detailed') return REPORT_SECTIONS.map((s) => s.id);
  return [...CORE, 'delivery_status', 'performance_measures', 'overdue_items', 'gaps', 'outlook'];
}

/** Sections actually present on a report (the generated result). */
export function reportSections(report) {
  const selected = Array.isArray(report?.sections) ? report.sections : REPORT_SECTIONS.map((s) => s.id);
  return REPORT_SECTIONS.filter((s) => selected.includes(s.id));
}