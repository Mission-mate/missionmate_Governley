/**
 * Helpers for bulk Contact import & export.
 *
 * Validation rules (per agreed plan):
 *  - First Name : MANDATORY — rows without it are excluded.
 *  - Last Name  : optional — blank if missing.
 *  - Email      : optional — must match a standard email format, else blank.
 *  - Phone      : optional — non-numeric chars stripped, else blank.
 *  - Contact Type: optional — must match a system enum value (matched by
 *                  label or value, case-insensitive). If not mapped / no match,
 *                  left blank (UI shows "–").
 */
import { CONTACT_TYPE_FIELD_ID, isMultiSelect } from '@/lib/contactTypeConfig';
import { fieldHasOptions, fieldIsMulti } from '@/lib/customFields';

// Built-in system fields the user can map their CSV columns onto.
const SYSTEM_FIELDS = [
  { key: 'first_name', label: 'First Name', required: true },
  { key: 'last_name', label: 'Last Name', required: false },
  { key: 'email', label: 'Email', required: false },
  { key: 'phone', label: 'Phone', required: false },
  { key: 'company', label: 'Company', required: false },
  { key: 'address', label: 'Address', required: false },
  { key: 'notes', label: 'Notes', required: false },
  { key: CONTACT_TYPE_FIELD_ID, label: 'Contact Type', required: false },
];

/**
 * Build the full list of map-able target fields: built-in system fields plus
 * the user-defined custom fields (which are stored on contact.custom_fields).
 * Each entry: { key, label, required, custom, type, options }
 */
export function buildTargetFields(customFields = []) {
  const customEntries = customFields.map((f) => ({
    key: f.id,
    label: f.name,
    required: false,
    custom: true,
    type: f.type,
    options: f.options || [],
  }));
  return [...SYSTEM_FIELDS, ...customEntries];
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
  // Free-text style fields (Text, Number, Phone, Date) are stored as-is.
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

/** Match a CSV contact-type value against the configured options. */
function matchContactType(raw, config) {
  if (!raw) return null;
  const needle = String(raw).trim().toLowerCase();
  const opt = (config?.options || []).find(
    (o) => o.value.toLowerCase() === needle || o.label.toLowerCase() === needle,
  );
  return opt ? opt.value : null;
}

/**
 * Suggest a default mapping by fuzzy-matching CSV headers to target fields.
 * Mapping is keyed by CSV header → target field key.
 * Returns { [csvHeader]: targetKey | '' }.
 */
export function suggestMapping(headers, targetFields = SYSTEM_FIELDS) {
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

/** Invert a header→targetKey mapping into targetKey→header (ignores duplicates, keeps first). */
function invertMapping(mapping) {
  const byTarget = {};
  Object.entries(mapping).forEach(([header, targetKey]) => {
    if (targetKey && !(targetKey in byTarget)) byTarget[targetKey] = header;
  });
  return byTarget;
}

// Optional free-text fields carried straight through from the CSV.
const TEXT_FIELDS = ['last_name', 'phone', 'company', 'address', 'notes'];

/**
 * Transform parsed CSV rows into Contact payloads using the user's mapping.
 *
 * Email-based deduplication:
 *  - Rows whose email already exists (existingByEmail) are either skipped or
 *    turned into updates, depending on duplicateMode ('skip' | 'update').
 *  - Duplicate emails within the same file: first wins, the rest are skipped.
 *  - Rows without a valid email have no dedup key and are always created.
 *
 * Updates MERGE: only fields the CSV maps *and* supplies a value for are
 * written, so a partial CSV never blanks out existing contact data.
 *
 * @param mapping  { [csvHeader]: targetKey } map
 * @param options  { existingByEmail: Map<string, Contact>, duplicateMode }
 * @returns { creates: object[], updates: object[], skippedName: number, skippedDup: number }
 */
export function buildContactPayloads(rows, mapping, ctConfig, customFields = [], options = {}) {
  const { existingByEmail = new Map(), duplicateMode = 'skip' } = options;
  const creates = [];
  const updates = [];
  let skippedName = 0;
  let skippedDup = 0;
  // Tracks emails already handled during this run, for within-file duplicates.
  const seenEmails = new Set();
  const multi = isMultiSelect(ctConfig);
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

    // Existing contact and the importer chose to skip duplicates.
    if (existing && duplicateMode !== 'update') {
      skippedDup += 1;
      continue;
    }

    const phone = cleanPhone(get('phone'));
    const typeMatch = matchContactType(get(CONTACT_TYPE_FIELD_ID), ctConfig);

    // Custom field values supplied by this row (null = not supplied).
    const resolvedCustom = {};
    if (typeMatch) {
      resolvedCustom[CONTACT_TYPE_FIELD_ID] = multi ? [typeMatch] : typeMatch;
    }
    for (const targetKey of Object.keys(byTarget)) {
      const field = customById[targetKey];
      if (!field) continue;
      const resolved = resolveCustomValue(get(targetKey), field);
      if (resolved !== null) resolvedCustom[targetKey] = resolved;
    }

    if (existing) {
      // Merge update — only write what the CSV actually supplied.
      const patch = { first_name: firstName };
      TEXT_FIELDS.forEach((k) => {
        const val = k === 'phone' ? phone : get(k);
        if (val) patch[k] = val;
      });
      if (Object.keys(resolvedCustom).length > 0) {
        patch.custom_fields = { ...(existing.custom_fields || {}), ...resolvedCustom };
      }
      updates.push({ id: existing.id, ...patch });
      continue;
    }

    creates.push({
      first_name: firstName,
      last_name: get('last_name') || '',
      email,
      phone,
      company: get('company') || '',
      address: get('address') || '',
      notes: get('notes') || '',
      custom_fields: resolvedCustom,
    });
  }

  return { creates, updates, skippedName, skippedDup };
}

/** Build a downloadable CSV template with the system field headers. */
export function buildTemplateCsv() {
  const headers = SYSTEM_FIELDS.map((f) => f.label);
  const sample = ['Jane', 'Doe', 'jane@example.com', '+61400000000', 'Acme Inc', '123 Main St', '', 'Member'];
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