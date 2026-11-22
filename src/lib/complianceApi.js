import { base44 } from '@/api/base44Client';
import { OPTION_COLORS } from '@/lib/registerColors';
import { localToday } from '@/lib/localClock';

const OPTION_COLOR_KEYS = OPTION_COLORS.map((c) => c.id);

// ── Field type helpers ───────────────────────────────────────────────────────
/** Compliance custom field types (mirrors the risk module set). */
export const COMPLIANCE_CUSTOM_FIELD_TYPES = ['Single Select', 'Text/Number', 'Date', 'Long Text'];

export function complianceFieldHasOptions(type) {
  return type === 'Single Select';
}

export function newComplianceFieldId() {
  return `cf_${crypto.randomUUID()}`;
}

// ── Default category / regulator options (plain, not colour-coded) ───────────
const CATEGORY_OPTIONS = [
  'Tax & Superannuation', 'Financial, Audit & Reporting', 'Governance & Corporate Reporting',
  'Employment & Workplace Relations', 'Work Health Safety', 'Privacy, Data & Cybersecurity',
  'Funding, Grants & Contracts', 'Licences, Permits & Accreditation', 'Service Delivery & Program Compliance',
  'Fundraising & Donations', 'Insurance, Property & Asset Compliance', 'Strategic', 'Operations',
].map((name) => ({ name }));

const REGULATOR_OPTIONS = [
  'ACNC', 'ASIC', 'ATO', 'Funding Body/Grant Provider', 'State/Territory Government Department',
  'Australian Government Department', 'Board or Committee', 'Accreditation Body',
  'Fair Work Ombudsman', 'ORIC',
].map((name) => ({ name }));

// ── Default field definitions for a Compliance Register ──────────────────────
export const DEFAULT_FIELDS = [
  { id: 'category',   label: 'Category',   type: 'Single Select', system: false, config: { options: CATEGORY_OPTIONS } },
  { id: 'regulator',  label: 'Regulator',  type: 'Single Select', system: false, config: { options: REGULATOR_OPTIONS } },
  {
    id: 'frequency',
    label: 'Frequency',
    type: 'Single Select',
    system: false,
    config: {
      options: [
        { name: 'One-off',   color: 'blue'   },
        { name: 'Monthly',   color: 'green'  },
        { name: 'Quarterly', color: 'orange' },
        { name: 'Annually',  color: 'purple' },
        { name: 'Ad Hoc',    color: 'blue'   },
        { name: 'Every',     color: 'green'  },
      ],
    },
  },
  { id: 'owner',      label: 'Owner',      type: 'Text/Number', system: false, config: {} },
  { id: 'due_date',   label: 'Due Date',   type: 'Date',        system: false, config: {} },
  {
    id: 'priority',
    label: 'Priority',
    type: 'Single Select',
    system: false,
    config: {
      options: [
        { name: 'High',   color: 'red'    },
        { name: 'Medium', color: 'orange' },
        { name: 'Low',    color: 'green'  },
      ],
    },
  },
  {
    id: 'status',
    label: 'Status',
    type: 'Single Select',
    system: true,
    config: {
      options: [
        { name: 'Not Started', color: 'blue'   },
        { name: 'In Progress', color: 'orange' },
        { name: 'Completed',   color: 'green'  },
        { name: 'On Hold',     color: 'purple' },
        { name: 'Cancelled',   color: 'blue'   },
      ],
    },
  },
];

/** IDs of fields that are always system-locked (cannot be deleted or moved). */
export const SYSTEM_FIELD_IDS = ['status'];

const FIXED_FIELD_IDS = ['status', 'priority', 'frequency'];

/** Force custom fields to their canonical order, status last. */
const FIELD_ORDER = ['category', 'regulator', 'frequency', 'owner', 'due_date', 'priority', 'status'];

export function normalizeFieldOrder(fields) {
  const byId = new Map(fields.map((f) => [f.id, f]));
  const ordered = FIELD_ORDER.map((id) => byId.get(id)).filter(Boolean);
  const extra = fields.filter((f) => !FIELD_ORDER.includes(f.id));
  return [...ordered, ...extra].map((f) => ({ ...f, system: SYSTEM_FIELD_IDS.includes(f.id) }));
}

/** Merge saved config fields with defaults, correcting older configs at runtime. */
export function resolveFields(config) {
  if (config?.fields && config.fields.length > 0) {
    const merged = config.fields.map((f) => {
      const fixed = FIXED_FIELD_IDS.includes(f.id) ? DEFAULT_FIELDS.find((d) => d.id === f.id) : null;
      if (fixed) return { ...f, label: fixed.label, type: fixed.type, config: fixed.config };
      // Upgrade legacy free-text Category/Regulator to colour-coded Single Select with default options.
      if ((f.id === 'category' || f.id === 'regulator') && (f.type !== 'Single Select' || !(f.config?.options?.length))) {
        const def = DEFAULT_FIELDS.find((d) => d.id === f.id);
        return { ...f, type: 'Single Select', config: def.config };
      }
      return f;
    });
    return normalizeFieldOrder(merged);
  }
  return DEFAULT_FIELDS;
}

// ── Register CRUD ─────────────────────────────────────────────────────────────
export function listComplianceRegisters() {
  return base44.entities.ComplianceRegister.filter({}, '-created_date');
}

export function createComplianceRegister({
  title, description, status, compliance_period_type, financial_year_start, financial_year_end,
}) {
  return base44.entities.ComplianceRegister.create({
    title: title.trim(),
    description: description?.trim() || '',
    status: status || 'active',
    compliance_period_type: compliance_period_type || 'Financial Year',
    financial_year_start: financial_year_start || null,
    financial_year_end: financial_year_end || null,
    config: { fields: DEFAULT_FIELDS },
  });
}

export function updateComplianceRegister(id, data) {
  return base44.entities.ComplianceRegister.update(id, data);
}

/** Persist the register's field configuration (options, custom fields, visibility). */
export function saveComplianceRegisterConfig(register, fields) {
  return base44.entities.ComplianceRegister.update(register.id, {
    config: { ...(register.config || {}), fields: normalizeFieldOrder(fields) },
  });
}

/**
 * Deletes calendars through a verified server-side cascade: each calendar is removed only
 * after its obligations and their checklists, notes, documents and folders are gone;
 * a failed calendar stays for a safe retry.
 * Resolves to { ok, deleted, failed: [{ id, title, stage, error }], missing }.
 */
export async function deleteComplianceCalendars(ids) {
  const { data } = await base44.functions.invoke('deleteComplianceCalendars', { calendar_ids: ids });
  return data;
}

// ── Obligation CRUD ───────────────────────────────────────────────────────────
export function listObligations(registerId) {
  return base44.entities.ComplianceObligation.filter({ register_id: registerId }, 'order_index');
}

export function createObligation(registerId, data) {
  return base44.entities.ComplianceObligation.create({ register_id: registerId, ...data });
}

export function updateObligation(id, data) {
  return base44.entities.ComplianceObligation.update(id, data);
}

/**
 * Deletes obligations through a verified server-side cascade: each obligation is removed only
 * after its checklist, notes, documents and folders are gone; a failed one stays for a safe retry.
 * Resolves to { ok, deleted, failed: [{ id, title, stage, error }], missing }.
 */
export async function deleteObligations(ids) {
  const { data } = await base44.functions.invoke('deleteObligations', { obligation_ids: ids });
  return data;
}

// ── Helpers ────────────────────────────────────────────────────────────────────
export function isOverdue(dueDateIso, status) {
  if (!dueDateIso || status === 'Completed' || status === 'Cancelled' || status === 'On Hold') return false;
  // Compared as plain dates against the device's local day — no UTC drift.
  return String(dueDateIso).slice(0, 10) < localToday();
}

export function formatDate(iso) {
  if (!iso) return '';
  try {
    const [y, m, d] = iso.split('-');
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    return `${d} ${months[parseInt(m, 10) - 1]} ${y}`;
  } catch { return iso; }
}

/** Generate next obligation ID for a register */
export function nextObligationId(obligations) {
  const nums = obligations
    .map((a) => a.obligation_id)
    .filter(Boolean)
    .map((id) => parseInt(id.replace(/[^0-9]/g, ''), 10))
    .filter((n) => !isNaN(n));
  const max = nums.length > 0 ? Math.max(...nums) : 0;
  return `OBL-${String(max + 1).padStart(3, '0')}`;
}

export const STATUS_STYLES = {
  'Not Started': { bg: 'bg-blue-100 dark:bg-blue-400/15',     text: 'text-blue-700 dark:text-blue-300'     },
  'In Progress': { bg: 'bg-orange-100 dark:bg-orange-400/15', text: 'text-orange-700 dark:text-orange-300' },
  'Completed':   { bg: 'bg-green-100 dark:bg-green-400/15',   text: 'text-green-700 dark:text-green-300'   },
  'On Hold':     { bg: 'bg-purple-100 dark:bg-purple-400/15', text: 'text-purple-700 dark:text-purple-300' },
  'Cancelled':   { bg: 'bg-gray-100 dark:bg-muted',           text: 'text-gray-500 dark:text-muted-foreground' },
};

export const PRIORITY_STYLES = {
  'High':   { bg: 'bg-red-100 dark:bg-red-400/15',     text: 'text-red-700 dark:text-red-300'     },
  'Medium': { bg: 'bg-amber-100 dark:bg-amber-400/15', text: 'text-amber-700 dark:text-amber-300' },
  'Low':    { bg: 'bg-green-100 dark:bg-green-400/15', text: 'text-green-700 dark:text-green-300' },
};