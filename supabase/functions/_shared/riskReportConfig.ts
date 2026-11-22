export const sectionFields = {
  executive_summary: ['executive_summary', 'risk_posture_statement'],
  key_themes: ['key_themes'], top_risks: ['top_risks_commentary'], overdue_items: ['top_risks_commentary'],
  governance: ['governance_findings'], recommendations: ['recommendations'], outlook: ['outlook'],
  risk_appetite: ['risk_appetite_assessment'], category_analysis: ['category_analysis'],
  inherent_residual: ['inherent_residual_analysis'], treatment_progress: ['treatment_progress'],
  control_effectiveness: ['control_effectiveness'], review_cadence: ['review_cadence'],
  owner_accountability: ['owner_accountability'], rating_trends: ['rating_trends'], closed_risks: ['closed_risks'],
};

export const verbosity = {
  concise: 'Use terse, decision-focused prose. Keep each narrative section to one short paragraph and lists to no more than 3 items.',
  detailed: 'Provide full analysis with evidence, named risks and material figures. Use 2-3 paragraphs where useful and 4-6 list items.',
  executive: 'Use tight board-level prose focused on implications, decisions and accountability. Keep each section concise but substantive.',
};

export function normaliseConfig(body, allowedSections) {
  const length = ['concise', 'detailed', 'executive'].includes(body?.length) ? body.length : 'detailed';
  const requested = Array.isArray(body?.sections) ? body.sections : allowedSections;
  const sections = requested.filter((id) => allowedSections.includes(id));
  return { length, sections: sections.length ? sections : allowedSections };
}

export function schemaForSections(sections) {
  const properties = {};
  const fields = new Set(sections.flatMap((id) => sectionFields[id] || []));
  fields.forEach((field) => {
    if (field === 'key_themes') properties[field] = { type: 'array', items: { type: 'object', properties: { title: { type: 'string' }, detail: { type: 'string' } } } };
    else if (field === 'governance_findings') properties[field] = { type: 'array', items: { type: 'object', properties: { title: { type: 'string' }, detail: { type: 'string' }, severity: { type: 'string', enum: ['info', 'warning', 'critical'] } } } };
    else if (field === 'recommendations') properties[field] = { type: 'array', items: { type: 'string' } };
    else properties[field] = { type: 'string' };
  });
  return { type: 'object', properties };
}