export const BOARD_OBJECT_TYPE = 'board';
/** Sub-bucket used for governance folders/documents within the board object. */
export const GOVERNANCE_OBJECT_ID = 'governance';

/** Document types selectable for meeting documents. */
export const DOC_TYPES = [
  { key: 'agenda', label: 'Agenda' },
  { key: 'minutes', label: 'Minutes' },
  { key: 'document', label: 'Document' },
];

/** Locked type used by governance documents. */
export const GOVERNANCE_DOC_TYPE = { key: 'governance', label: 'Governance' };

const ALL_DOC_TYPES = [...DOC_TYPES, GOVERNANCE_DOC_TYPE];

export function docTypeLabel(key) {
  return (ALL_DOC_TYPES.find(t => t.key === key) || DOC_TYPES[2]).label;
}