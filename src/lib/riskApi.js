import { base44 } from '@/api/base44Client';

/** List all risks, newest first. */
export function listRisks() {
  return base44.entities.Risk.list('-created_date');
}

/**
 * Read one risk. A record that doesn't exist resolves to null (a genuine "not found");
 * any other failure throws, so callers can tell an outage apart from a missing risk.
 */
export async function getRisk(id) {
  try {
    return await base44.entities.Risk.get(id);
  } catch (err) {
    if (statusOf(err) === 404) return null;
    throw err;
  }
}

/** Thrown by createRisk / saveRisk when the Risk ID is already used by another risk. */
export class RiskDuplicateIdError extends Error {
  constructor(message) {
    super(message || 'This Risk ID already exists.');
  }
}

const statusOf = (err) => err?.status ?? err?.response?.status;
const dataOf = (err) => err?.data ?? err?.response?.data;
const isDuplicate = (err) => statusOf(err) === 409 && dataOf(err)?.duplicate;

/** The next available Risk ID, suggested by the server (display only — assigned on save). */
export async function previewRiskId() {
  const res = await base44.functions.invoke('createRisk', { preview: true });
  return res.data.risk_id;
}

/**
 * Create a risk through the server, which assigns and guarantees a unique ID.
 * auto: the server picks the next available ID (riskId is ignored); otherwise
 * riskId is kept and rejected with RiskDuplicateIdError if already used.
 */
export async function createRisk(fields, { riskId, auto }) {
  try {
    const res = await base44.functions.invoke('createRisk', { fields, risk_id: riskId, auto });
    return res.data.record;
  } catch (err) {
    if (isDuplicate(err)) throw new RiskDuplicateIdError();
    throw err;
  }
}

/** Thrown by saveRisk when the same data was changed elsewhere since editing began. */
export class RiskConflictError extends Error {
  constructor({ conflicts, record }) {
    super('This risk was changed by someone else.');
    this.conflicts = conflicts;
    this.record = record;
  }
}

/**
 * Update a risk through the conflict-checked server path — the only way Risk
 * records are updated. Request: { fields, base, arrayOps } (see the saveRisk function).
 * Resolves with the saved record; throws RiskConflictError on a conflict.
 */
export async function saveRisk(id, request) {
  try {
    const res = await base44.functions.invoke('saveRisk', { id, ...request });
    return res.data.record;
  } catch (err) {
    if (isDuplicate(err)) throw new RiskDuplicateIdError();
    if (statusOf(err) === 409 && dataOf(err)?.conflict) throw new RiskConflictError(dataOf(err));
    throw err;
  }
}

export function deleteRisk(id) {
  return base44.entities.Risk.delete(id);
}

/** Risk Status options — fixed, not user-editable. */
export const DEFAULT_STATUS_OPTIONS = ['Open', 'Closed'];

/* ------------------------------------------------------------------ */
/* Risk field configuration (system-locked single-select fields)      */
/* ------------------------------------------------------------------ */

const FIELD_CONFIG_KEY = 'risk_field_config';

// System-locked custom fields. All are Single Select; options are editable
// (add/edit/remove) but the field itself cannot be deleted or retyped.
export const RISK_SYSTEM_FIELDS = [
  {
    id: 'category',
    label: 'Risk Category',
    type: 'Single Select',
    system: true,
    isVisible: true,
    config: {
      options: [
        { name: 'Strategic', color: 'blue' },
        { name: 'Financial', color: 'green' },
        { name: 'Operational', color: 'orange' },
        { name: 'Compliance', color: 'purple' },
        { name: 'Reputational', color: 'red' },
      ],
    },
  },
  {
    id: 'risk_appetite',
    label: 'Risk Appetite',
    type: 'Single Select',
    system: true,
    isVisible: true,
    config: {
      options: [
        { name: 'Within Appetite', color: 'green' },
        { name: 'Outside Appetite', color: 'red' },
      ],
    },
  },
  {
    id: 'review_outcome',
    label: 'Review Outcome',
    type: 'Single Select',
    system: true,
    isVisible: true,
    guide: 'Used in Monitoring & Review to record the outcome of each risk review.',
    config: {
      options: [
        { name: 'Risk Increased', color: 'red' },
        { name: 'Risk Decreased', color: 'green' },
        { name: 'No Change', color: 'blue' },
        { name: 'Closed', color: 'purple' },
        { name: 'Escalated', color: 'orange' },
      ],
    },
  },
];

/** Deep-clone the default system fields. */
export function defaultRiskFields() {
  return JSON.parse(JSON.stringify(RISK_SYSTEM_FIELDS));
}

// Only Risk Category is user-configurable; the others are fixed code constants.
export const MANAGED_FIELD_IDS = ['category'];

/**
 * Load the risk field config — always the three canonical system fields, with
 * saved option overrides merged in for the managed (Risk Category) field only.
 */
export async function getRiskFieldConfig() {
  const rows = await base44.entities.AppConfig.filter({ key: FIELD_CONFIG_KEY });
  const saved = rows?.[0]?.settings?.fields;
  if (!Array.isArray(saved) || saved.length === 0) return defaultRiskFields();

  return defaultRiskFields().map((def) => {
    if (!MANAGED_FIELD_IDS.includes(def.id)) return def;
    const match = saved.find((f) => f.id === def.id);
    return Array.isArray(match?.config?.options) ? { ...def, config: match.config } : def;
  });
}

/** Persist the risk field config — only the managed (Risk Category) field is stored. */
export async function saveRiskFieldConfig(fields) {
  const rows = await base44.entities.AppConfig.filter({ key: FIELD_CONFIG_KEY });
  const clean = (fields || []).filter((f) => MANAGED_FIELD_IDS.includes(f.id));
  const payload = { key: FIELD_CONFIG_KEY, settings: { fields: clean } };
  if (rows?.[0]) return base44.entities.AppConfig.update(rows[0].id, payload);
  return base44.entities.AppConfig.create(payload);
}

/** Helper: options array for a given field id from a resolved config. */
export function fieldOptions(fields, id) {
  const f = (fields || []).find((x) => x.id === id);
  return f?.config?.options || [];
}