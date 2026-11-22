export const REPORT_SECTIONS = [
  { id: 'executive_summary', label: 'Executive Summary', types: ['comprehensive', 'overdue_risks', 'overdue_treatments'] },
  { id: 'key_themes', label: 'Key Strategic Themes', types: ['comprehensive', 'overdue_risks', 'overdue_treatments'] },
  { id: 'top_risks', label: 'Top Residual Risks', types: ['comprehensive'] },
  { id: 'overdue_items', label: 'Overdue Items', types: ['overdue_risks', 'overdue_treatments'] },
  { id: 'governance', label: 'Governance & Compliance Findings', types: ['comprehensive', 'overdue_risks', 'overdue_treatments'] },
  { id: 'recommendations', label: 'Recommendations', types: ['comprehensive', 'overdue_risks', 'overdue_treatments'] },
  { id: 'outlook', label: 'Outlook', types: ['comprehensive', 'overdue_risks', 'overdue_treatments'] },
  { id: 'risk_appetite', label: 'Risk Appetite Assessment', types: ['comprehensive', 'overdue_risks', 'overdue_treatments'] },
  { id: 'category_analysis', label: 'Risk by Category', types: ['comprehensive', 'overdue_risks', 'overdue_treatments'] },
  { id: 'inherent_residual', label: 'Inherent vs Residual Analysis', types: ['comprehensive'] },
  { id: 'treatment_progress', label: 'Treatment Action Progress', types: ['comprehensive', 'overdue_treatments'] },
  { id: 'control_effectiveness', label: 'Control Effectiveness Review', types: ['comprehensive', 'overdue_treatments'] },
  { id: 'review_cadence', label: 'Review Cadence & Overdue Reviews', types: ['comprehensive', 'overdue_risks'] },
  { id: 'owner_accountability', label: 'Risk Owner Accountability', types: ['comprehensive', 'overdue_risks', 'overdue_treatments'] },
  { id: 'rating_trends', label: 'Rating Trend & Movements', types: ['comprehensive'] },
  { id: 'closed_risks', label: 'Closed Risks Summary', types: ['comprehensive'] },
];

export const LENGTH_PRESETS = {
  concise: { label: 'Concise', description: 'Short, decision-focused report' },
  detailed: { label: 'Detailed', description: 'Full analysis across all sections' },
  executive: { label: 'Executive', description: 'Tight board-level narrative' },
};

export const sectionsForType = (type) => REPORT_SECTIONS.filter((section) => section.types.includes(type));

export function defaultSections(type, length) {
  const available = sectionsForType(type).map((section) => section.id);
  if (length === 'detailed') return available;
  if (length === 'concise') return ['executive_summary', type === 'comprehensive' ? 'top_risks' : 'overdue_items', 'recommendations'];
  return ['executive_summary', 'key_themes', type === 'comprehensive' ? 'top_risks' : 'overdue_items', 'recommendations', 'outlook'];
}

export function selectedSections(snapshot, type) {
  return snapshot?.config?.sections || defaultSections(type, 'detailed');
}