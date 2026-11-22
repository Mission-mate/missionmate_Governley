/**
 * Where an obligations table reads/writes its records. Grants and Contracts share the same
 * obligations UI; each source keeps its own record type, parent link, and required fields.
 */
export const GRANT_OBLIGATIONS = {
  entity: 'ReportingObligation',
  parentField: 'grant_id',
  objectType: 'reporting_obligation',
  required: ['title', 'reporting_type', 'due_date', 'status'],
  heading: 'Reporting Obligations',
  subheading: 'Manage and track your milestones and acquittals.',
  parentLabel: 'Grant Title',
  providerLabel: 'Grant Provider',
};

export const CONTRACT_OBLIGATIONS = {
  entity: 'ContractObligation',
  parentField: 'contract_id',
  objectType: 'contract_obligation',
  required: ['title'],
  heading: 'Obligations and Milestones',
  subheading: 'Manage and track contractual obligations, milestones and other deliverables from either party',
  searchOnlyToolbar: true,
  singleNotePage: true,
  parentLabel: 'Contract Title',
  providerLabel: 'Counterparty',
};

const OWNER_BASE = {
  required: ['title', 'reporting_type', 'due_date', 'status'],
  heading: 'Compliance Obligations',
  itemLabel: 'Compliance Obligation',
  emptyText: 'No obligations yet. Add reporting deadlines, acquittals and funding conditions so nothing is missed.',
};

export const PROGRAM_OBLIGATIONS = {
  ...OWNER_BASE,
  entity: 'ProgramObligation',
  parentField: 'program_id',
  subheading: 'Track funder and regulatory requirements for this program',
  objectType: 'program_obligation',
  parentLabel: 'Program Title',
  providerLabel: 'Program Lead',
};

export const PROJECT_OBLIGATIONS = {
  ...OWNER_BASE,
  entity: 'ProjectObligation',
  parentField: 'project_id',
  subheading: 'Track funder and regulatory requirements for this project',
  objectType: 'project_obligation',
  parentLabel: 'Project Title',
  providerLabel: 'Project Manager',
};

export const ownerObligationsKey = (source, ownerId) => [source.entity, 'list', ownerId];

export const contractObligationsKey = (contractId) => ['contractObligations', contractId];