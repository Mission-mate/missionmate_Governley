// Shared search / filter / group logic for the strategy level tables (L3–L7).
import { customValueText } from '@/lib/strategy/levelFields';

export const BLOCK_FIELDS = [
  { key: 'health', label: 'Health' },
  { key: 'owner', label: 'Owner' },
  { key: 'status', label: 'Status' },
  { key: 'priority', label: 'Priority' },
];

/**
 * Resolves a field's comparable text for a block. Custom columns read through
 * custom_fields via the shared formatter; built-in fields read the property.
 */
export const fieldValue = (block, field) => {
  if (!field) return '';
  if (field.custom) return customValueText(field.column, block?.custom_fields?.[field.column.id]);
  const raw = block?.[field.key];
  return raw === undefined || raw === null ? '' : String(raw);
};

/** All custom_fields values of a block flattened to one searchable string. */
const customHaystack = (b) => {
  const map = b?.custom_fields;
  if (!map || typeof map !== 'object') return '';
  return Object.values(map)
    .map((v) => (Array.isArray(v) ? v.filter(Boolean).join(' ') : v))
    .filter((v) => v !== undefined && v !== null && v !== '')
    .join(' ');
};

export const matchesSearch = (b, search) => {
  const q = (search || '').trim().toLowerCase();
  if (!q) return true;
  return (
    (b.title || '').toLowerCase().includes(q) ||
    (b.custom_id || '').toLowerCase().includes(q) ||
    (b.owner || '').toLowerCase().includes(q) ||
    String(customHaystack(b)).toLowerCase().includes(q)
  );
};

/** `fields` supplies the field definitions so custom column keys resolve. */
export const matchesFilters = (b, filters = {}, fields = BLOCK_FIELDS) =>
  Object.entries(filters).every(([key, value]) => {
    if (!value) return true;
    const field = fields.find((f) => f.key === key) || { key };
    return fieldValue(b, field) === value;
  });

/** Distinct, sorted values present for a field across the given rows. */
export const blockFieldValues = (rows = [], field) =>
  [...new Set(rows.map((b) => fieldValue(b, field)).filter(Boolean))]
    .sort((a, b) => String(a).localeCompare(String(b)));

/** Group rows by a field — returns [{ label, rows }], unset values last under '—'. */
export function groupBlocks(rows = [], field) {
  const map = new Map();
  rows.forEach((b) => {
    const label = fieldValue(b, field) || '—';
    if (!map.has(label)) map.set(label, []);
    map.get(label).push(b);
  });
  return [...map.entries()]
    .map(([label, groupRows]) => ({ label, rows: groupRows }))
    .sort((a, b) => (a.label === '—' ? 1 : b.label === '—' ? -1 : a.label.localeCompare(b.label)));
}