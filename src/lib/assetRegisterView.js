import { CONDITION_OPTIONS, getAssetOptions, getAssetCustomColumns } from '@/lib/assetRegister';

const CUSTOM = 'custom:';

/** Reads a built-in field or a `custom:<id>` custom column value off an asset. */
export function assetFieldValue(a, fid) {
  return fid.startsWith(CUSTOM) ? a.custom_fields?.[fid.slice(CUSTOM.length)] : a[fid];
}

/** Filterable / chartable asset fields with their option values (incl. Single Select custom columns). */
export function assetPickFields(register) {
  const opts = getAssetOptions(register);
  return [
    { id: 'asset_type', label: 'Asset Type', values: opts.asset_types.map((o) => o.name) },
    { id: 'condition', label: 'Condition', values: CONDITION_OPTIONS.map((o) => o.name) },
    { id: 'location', label: 'Location', values: opts.locations.map((o) => o.name) },
    ...getAssetCustomColumns(register)
      .filter((c) => c.type === 'Single Select')
      .map((c) => ({ id: `${CUSTOM}${c.id}`, label: c.title, values: (c.config?.options || []).map((o) => o.name) })),
  ];
}

export const SORT_FIELDS = [
  { id: 'warranty_expiry', label: 'Warranty Expiry' },
  { id: 'purchase_date', label: 'Purchase Date' },
];

/** Built-in sort fields plus Date custom columns. */
export function assetSortFields(register) {
  return [
    ...SORT_FIELDS,
    ...getAssetCustomColumns(register).filter((c) => c.type === 'Date').map((c) => ({ id: `${CUSTOM}${c.id}`, label: c.title })),
  ];
}

/** Search + filters + sort. Empty dates always sort last. */
export function filterAndSortAssets(items, { search, filters, sort }) {
  const q = (search || '').trim().toLowerCase();
  const rows = items.filter((a) => {
    if (q && ![a.title, a.asset_id, a.serial_number, a.asset_type, a.location]
      .some((v) => (v || '').toLowerCase().includes(q))) return false;
    return Object.entries(filters).every(([fid, val]) => !val || (assetFieldValue(a, fid) || '') === val);
  });
  if (!sort) return rows;
  const dir = sort.direction === 'desc' ? -1 : 1;
  return [...rows].sort((a, b) => {
    const da = assetFieldValue(a, sort.field) || ''; const db = assetFieldValue(b, sort.field) || '';
    if (!da && !db) return 0;
    if (!da) return 1;
    if (!db) return -1;
    return (da < db ? -1 : da > db ? 1 : 0) * dir;
  });
}