/**
 * Helpers for bulk Member import.
 *
 * Validation rules (mirroring the Contact import):
 *  - First Name : MANDATORY — rows without it are excluded.
 *  - Last Name  : optional — blank if missing.
 *  - Email      : optional — must match a standard email format, else blank.
 *  - Phone      : optional — non-numeric chars stripped, else blank.
 *  - Membership Structure : optional — matched by structure name (case-insensitive);
 *                  resolves to the structure id + cached name. Unmatched = left blank.
 *  - Status     : optional — must match a system enum (active/pending/expired),
 *                  defaults to 'active' when missing/invalid.
 *  - Start / Expiration Date : optional — passed through if present.
 *  - Notes      : optional.
 *  - Custom fields : resolved against the 'membership' custom field config.
 */
import { fieldHasOptions, fieldIsMulti } from '@/lib/customFields';

// Built-in fields the user can map their CSV columns onto. Distinct from
// MEMBER_SYSTEM_FIELDS in @/lib/memberSystemFields, which is the contact/profile
// display list — these are the import mapping targets.
const MEMBER_IMPORT_TARGET_FIELDS = [
  { key: 'first_name', label: 'First Name', required: true },
  { key: 'last_name', label: 'Last Name', required: false },
  { key: 'email', label: 'Email', required: false },
  { key: 'phone', label: 'Phone', required: false },
  { key: 'membership_structure_name', label: 'Membership Plan', required: false },
  { key: 'membership_tier_name', label: 'Tier', required: false },
  { key: 'status', label: 'Status', required: false },
  { key: 'start_date', label: 'Start Date', required: false },
  { key: 'expiration_date', label: 'Expiration Date', required: false },
  { key: 'notes', label: 'Notes', required: false },
];

const VALID_STATUS = ['active', 'pending', 'expired'];

/**
 * Build the full list of map-able target fields: built-in system fields plus
 * the user-defined custom fields (stored on member.custom_fields).
 */
export function buildMemberTargetFields(customFields = []) {
  const customEntries = customFields.map((f) => ({
    key: f.id,
    label: f.name,
    required: false,
    custom: true,
    type: f.type,
    options: f.options || [],
  }));
  return [...MEMBER_IMPORT_TARGET_FIELDS, ...customEntries];
}

/** Match a CSV value against a custom field's options (by label or value, case-insensitive). */
function matchCustomOption(raw, field) {
  if (!raw) return null;
  const needle = String(raw).trim().toLowerCase();
  const opt = (field.options || []).find((o) => {
    const v = (o.value ?? o).toString().toLowerCase();
    const l = (o.label ?? o).toString().toLowerCase();
    return v === needle || l === needle;
  });
  if (!opt) return null;
  return opt.value ?? opt;
}

/** Resolve a CSV cell into the stored value for a given custom field. */
function resolveCustomValue(raw, field) {
  const val = (raw ?? '').toString().trim();
  if (!val) return null;
  if (fieldHasOptions(field.type)) {
    const match = matchCustomOption(val, field);
    if (!match) return null;
    return fieldIsMulti(field.type) ? [match] : match;
  }
  return val;
}

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

/** Strip everything except digits and a leading +. */
function cleanPhone(raw) {
  if (!raw) return '';
  const str = String(raw).trim();
  const plus = str.startsWith('+') ? '+' : '';
  return plus + str.replace(/[^0-9]/g, '');
}

/** Match a CSV structure name against the configured membership structures. */
function matchStructure(raw, structures = []) {
  if (!raw) return null;
  const needle = String(raw).trim().toLowerCase();
  return structures.find((s) => (s.name || '').toLowerCase() === needle) || null;
}

/** Match a CSV tier name against the tiers configured on the matched plan. */
function matchTier(raw, structure) {
  if (!raw || !structure) return null;
  const needle = String(raw).trim().toLowerCase();
  return (structure.tiers || []).find((t) => (t?.name || '').toLowerCase() === needle) || null;
}

/**
 * Suggest a default mapping by fuzzy-matching CSV headers to target fields.
 * Returns { [csvHeader]: targetKey | '' }.
 */
export function suggestMapping(headers, targetFields = MEMBER_IMPORT_TARGET_FIELDS) {
  const norm = (s) => s.toLowerCase().replace(/[^a-z0-9]/g, '');
  const map = {};
  headers.forEach((h) => {
    const nh = norm(h);
    const found = targetFields.find((f) => {
      const target = norm(f.label);
      const targetKey = norm(f.key);
      return nh === target || nh === targetKey || nh.includes(target) || target.includes(nh);
    });
    map[h] = found ? found.key : '';
  });
  return map;
}

/** Invert a header→targetKey mapping into targetKey→header (keeps first). */
function invertMapping(mapping) {
  const byTarget = {};
  Object.entries(mapping).forEach(([header, targetKey]) => {
    if (targetKey && !(targetKey in byTarget)) byTarget[targetKey] = header;
  });
  return byTarget;
}

/**
 * Transform parsed CSV rows into Member payloads using the user's mapping.
 *
 * Email-based deduplication:
 *  - Rows whose email already exists (existingByEmail) are either skipped or
 *    turned into updates, depending on duplicateMode ('skip' | 'update').
 *  - Duplicate emails within the same file: first wins, the rest are skipped.
 *  - Rows without an email have no dedup key and are always created.
 *
 * @returns { creates: object[], updates: object[], skippedName: number, skippedDup: number }
 */
export function buildMemberPayloads(rows, mapping, structures = [], customFields = [], options = {}) {
  const { existingByEmail = new Map(), duplicateMode = 'skip' } = options;
  const creates = [];
  const updates = [];
  let skippedName = 0;
  let skippedDup = 0;
  // Tracks emails already handled during this run, for within-file duplicates.
  const seenEmails = new Set();
  const byTarget = invertMapping(mapping);
  const customById = Object.fromEntries(customFields.map((f) => [f.id, f]));

  for (const row of rows) {
    const get = (targetKey) => {
      const header = byTarget[targetKey];
      return header ? (row[header] ?? '').toString().trim() : '';
    };

    const firstName = get('first_name');
    if (!firstName) {
      skippedName += 1;
      continue;
    }

    const rawEmail = get('email');
    const email = rawEmail && EMAIL_RE.test(rawEmail) ? rawEmail : '';
    const key = email.toLowerCase();

    // Duplicate emails within the same file: first row wins, rest are skipped.
    if (key && seenEmails.has(key)) {
      skippedDup += 1;
      continue;
    }
    if (key) seenEmails.add(key);
    const existing = key ? existingByEmail.get(key) : null;

    // Existing member and the importer chose to skip duplicates.
    if (existing && duplicateMode !== 'update') {
      skippedDup += 1;
      continue;
    }

    const phone = cleanPhone(get('phone'));
    const structure = matchStructure(get('membership_structure_name'), structures);
    const rawStatus = get('status').toLowerCase();
    const status = VALID_STATUS.includes(rawStatus) ? rawStatus : 'active';

    const custom_fields = {};
    for (const targetKey of Object.keys(byTarget)) {
      const field = customById[targetKey];
      if (!field) continue;
      const resolved = resolveCustomValue(get(targetKey), field);
      if (resolved !== null) custom_fields[targetKey] = resolved;
    }

    const payload = {
      first_name: firstName,
      last_name: get('last_name') || '',
      email,
      phone,
      status,
      notes: get('notes') || '',
      custom_fields,
    };

    if (structure) {
      payload.membership_structure_id = structure.id;
      payload.membership_structure_name = structure.name;
      // Tier is resolved against the matched plan's own tiers — an unmatched or
      // blank tier is simply left empty, same as an unmatched plan name.
      const tier = matchTier(get('membership_tier_name'), structure);
      if (tier) {
        payload.membership_tier_id = tier.id;
        payload.membership_tier_name = tier.name;
      }
    }
    const startDate = get('start_date');
    if (startDate) payload.start_date = startDate;
    const expDate = get('expiration_date');
    if (expDate) payload.expiration_date = expDate;

    if (existing) updates.push({ id: existing.id, ...payload });
    else creates.push(payload);
  }

  return { creates, updates, skippedName, skippedDup };
}

/** Build a downloadable CSV template with the member system field headers. */
export function buildTemplateCsv() {
  const headers = MEMBER_IMPORT_TARGET_FIELDS.map((f) => f.label);
  const sample = ['Jane', 'Doe', 'jane@example.com', '+61400000000', 'Annual Membership', '', 'active', '2026-01-01', '2026-12-31', ''];
  return `${headers.join(',')}\n${sample.join(',')}\n`;
}

/** Trigger a browser download for a text blob. */
export function downloadCsv(filename, content) {
  const blob = new Blob([content], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}