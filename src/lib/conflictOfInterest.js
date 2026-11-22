import { base44 } from '@/api/base44Client';
import { calcNextReviewDate, REVIEW_FREQUENCIES } from '@/lib/reviewDateUtils';
import { localToday } from '@/lib/localClock';

export { calcNextReviewDate, REVIEW_FREQUENCIES };

/** Review frequency options available on Conflict of Interest records. */
export const COI_REVIEW_FREQUENCIES = ['Quarterly', 'Annually', 'Every', 'Ad Hoc', 'Not Required'];

/** 'Not Required' means the record is saved without review dates. */
export function reviewDatesRequired(frequency) {
  return frequency !== 'Not Required';
}

// AppConfig key holding the field configuration for the global conflict register

// ── Default / locked field definitions ───────────────────────────────────────
// System fields are fixed (cannot be deleted or reordered). Custom fields can be
// added in the Configure Fields pane and are stored in custom_fields on each record.
const DEFAULT_FIELDS = [
  { id: 'date_of_disclosure', label: 'Date of Disclosure', type: 'Date', system: true, config: {} },
  { id: 'description', label: 'Conflict of Interest Description', type: 'Long Text', system: true, config: {} },
  {
    id: 'status',
    label: 'Status',
    type: 'Single Select',
    system: true,
    locked: true,
    config: { options: [{ name: 'Open', color: 'blue' }, { name: 'Closed', color: 'green' }] },
  },
  {
    id: 'risk_exposure',
    label: 'Risk Exposure',
    type: 'Single Select',
    system: true,
    config: { options: [{ name: 'High', color: 'red' }, { name: 'Medium', color: 'orange' }, { name: 'Low', color: 'green' }] },
  },
  {
    id: 'committee_notified',
    label: 'Committee Notified',
    type: 'Single Select',
    system: true,
    config: { options: [{ name: 'Yes', color: 'green' }, { name: 'No', color: 'red' }] },
  },
  { id: 'approved_by', label: 'Approved By', type: 'Text/Number', system: true, config: {} },
  { id: 'review_frequency', label: 'Review Frequency', type: 'Review Frequency', system: true, config: {} },
  { id: 'last_review_date', label: 'Last Review Date', type: 'Date', system: true, config: {} },
  { id: 'next_review_date', label: 'Next Review Date', type: 'Date', system: true, config: {} },
];

const SYSTEM_FIELD_IDS = DEFAULT_FIELDS.map(f => f.id);

/** Force system fields to lead in canonical order, then custom fields in their order. */
function normalizeFieldOrder(fields) {
  const system = SYSTEM_FIELD_IDS
    .map(id => {
      const saved = fields.find(f => f.id === id);
      const def = DEFAULT_FIELDS.find(f => f.id === id);
      // Locked system fields (e.g. Status) always use the canonical config — options can't be edited.
      if (def?.locked) return { ...def, system: true };
      // keep saved option edits but always re-apply the system flag + canonical type/label
      return saved ? { ...def, ...saved, system: true } : { ...def, system: true };
    })
    .filter(Boolean);
  // Compliance-only system field (Type) stays system and sits after Status.
  const type = fields.find(f => f.id === 'conflict_type');
  if (type) system.splice(system.findIndex(f => f.id === 'status') + 1, 0, { ...type, system: true });
  const custom = fields
    .filter(f => !SYSTEM_FIELD_IDS.includes(f.id) && f.id !== 'conflict_type')
    .map(f => ({ ...f, system: false }));
  return [...system, ...custom];
}

export function resolveFields(config) {
  if (config?.fields && config.fields.length > 0) return normalizeFieldOrder(config.fields);
  return DEFAULT_FIELDS;
}


// ── Conflict CRUD ───────────────────────────────────────────────────────────
/** Conflicts belonging to one compliance register. */
export function listConflicts(registerId) {
  return base44.entities.ConflictOfInterest.filter({ register_id: registerId }, 'order_index');
}

export function createConflict(data) {
  return base44.entities.ConflictOfInterest.create(data);
}

export function updateConflict(id, data) {
  return base44.entities.ConflictOfInterest.update(id, data);
}

/**
 * Delete a conflict through the backend cascade so its actions, notes and
 * documents are removed with it instead of being left orphaned.
 */
export async function deleteConflict(id) {
  const res = await base44.functions.invoke('deleteConflict', { conflict_id: id });
  return res.data;
}

// ── Helpers ─────────────────────────────────────────────────────────────────
/** Generate the next conflict ID (COI-001 ...) from existing records. */
export function nextConflictId(conflicts) {
  const nums = conflicts
    .map(c => c.conflict_id)
    .filter(Boolean)
    .map(id => parseInt(id.replace(/[^0-9]/g, ''), 10))
    .filter(n => !isNaN(n));
  const max = nums.length > 0 ? Math.max(...nums) : 0;
  return `COI-${String(max + 1).padStart(3, '0')}`;
}

// Display format: DD MMM YYYY (e.g. 02 May 2026)
export function formatDate(iso) {
  if (!iso) return '';
  try {
    const [y, m, d] = iso.split('-');
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    return `${d} ${months[parseInt(m, 10) - 1]} ${y}`;
  } catch { return iso; }
}

export const STATUS_STYLES = {
  Open: { bg: 'bg-blue-100', text: 'text-blue-700' },
  Closed: { bg: 'bg-green-100', text: 'text-green-700' },
};

/** A conflict is overdue when its next_review_date is in the past and it's not closed. */
export function isConflictOverdue(conflict) {
  if (!conflict || conflict.status === 'Closed') return false;
  if (!conflict.next_review_date) return false;
  return conflict.next_review_date < localToday();
}

/** Committee Notified badge colours — mirrors the register table's option colours. */
export const NOTIFIED_STYLES = {
  Yes: { bg: 'bg-green-100', text: 'text-green-700' },
  No: { bg: 'bg-red-100', text: 'text-red-700' },
  'Not Required': { bg: 'bg-gray-100', text: 'text-gray-600' },
};

/** Conflict Type options (ColoredSelect format) and matching view badges. */
export const CONFLICT_TYPE_OPTIONS = [
  { name: 'Perceived', color: 'blue' }, { name: 'Potential', color: 'orange' }, { name: 'Actual', color: 'red' },
];
/**
 * Compliance register system fields: Committee Notified uses Yes / Not Required,
 * and Type sits directly after Status.
 */
export function complianceSystemFields() {
  return DEFAULT_FIELDS.flatMap((f) => {
    if (f.id === 'committee_notified') {
      return [{ ...f, config: { options: [{ name: 'Yes', color: 'green' }, { name: 'Not Required', color: 'gray' }] } }];
    }
    if (f.id === 'status') {
      return [f, { id: 'conflict_type', label: 'Type', type: 'Single Select', system: true, config: { options: CONFLICT_TYPE_OPTIONS } }];
    }
    return [f];
  });
}

export const CONFLICT_TYPE_STYLES = {
  Perceived: { bg: 'bg-blue-100', text: 'text-blue-700' },
  Potential: { bg: 'bg-orange-100', text: 'text-orange-700' },
  Actual: { bg: 'bg-red-100', text: 'text-red-700' },
};

export const RISK_STYLES = {
  High: { bg: 'bg-red-100', text: 'text-red-700' },
  Medium: { bg: 'bg-orange-100', text: 'text-orange-700' },
  Low: { bg: 'bg-green-100', text: 'text-green-700' },
};