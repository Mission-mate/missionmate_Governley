import { CONTACT_TYPE_FIELD_ID } from '@/lib/contactTypeConfig';

/**
 * Returns true if a contact matches the given search + filters.
 * Shared by the contacts table view and the export-by-group dialog.
 */
export function contactMatches(c, { search = '', filters = {} } = {}) {
  const { contactTypes = [], tags = [], custom = {} } = filters;
  const trimmed = (search || '').trim().toLowerCase();

  // Search across common text fields
  if (trimmed) {
    const haystack = [c.first_name, c.last_name, c.email, c.company, c.phone]
      .filter(Boolean)
      .join(' ')
      .toLowerCase();
    if (!haystack.includes(trimmed)) return false;
  }

  // Contact type filter (multi-select OR)
  if (contactTypes.length > 0) {
    const raw = c.custom_fields?.[CONTACT_TYPE_FIELD_ID];
    const values = Array.isArray(raw) ? raw : (raw ? [raw] : []);
    if (!contactTypes.some((t) => values.includes(t))) return false;
  }

  // Tag filter (multi-select OR) — tags stored by name or id
  if (tags.length > 0) {
    const ctags = c.tags || [];
    if (!tags.some((t) => ctags.includes(t))) return false;
  }

  // Custom field filters: AND across fields, OR within each field's values
  for (const [fieldId, selectedValues] of Object.entries(custom)) {
    if (!selectedValues || selectedValues.length === 0) continue;
    const raw = c.custom_fields?.[fieldId];
    const values = Array.isArray(raw) ? raw : (raw != null && raw !== '' ? [raw] : []);
    if (!selectedValues.some((v) => values.includes(v))) return false;
  }

  return true;
}