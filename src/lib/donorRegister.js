import { base44 } from '@/api/base44Client';
import { format, parseISO } from 'date-fns';
import { toIdOptions } from '@/lib/configNormalize';
import { localToday } from '@/lib/localClock';

const opts = (pairs) => pairs.map(([name, color]) => ({ name, color }));

export const DONOR_TYPE_OPTIONS = opts([['Individual', 'blue'], ['Business', 'purple'], ['Trust', 'green'], ['Foundation', 'green'], ['Ancillary fund', 'orange'], ['Estate', 'gray'], ['Community group', 'blue'], ['Government', 'purple'], ['Anonymous', 'gray'], ['Other', 'gray']]);
export const YES_NO_OPTIONS = opts([['Yes', 'orange'], ['No', 'gray']]);
export const DUE_DILIGENCE_OPTIONS = opts([['Not Required', 'gray'], ['Pending', 'orange'], ['Completed', 'green'], ['Concerned', 'red']]);
export const RISK_OPTIONS = opts([['Low', 'blue'], ['Medium', 'orange'], ['High', 'red']]);
export const DONATION_TYPE_OPTIONS = opts([['Cash Donation', 'green'], ['In-kind Donation', 'purple'], ['Bequest', 'gray'], ['Property', 'orange'], ['Shares', 'blue'], ['Auction Purchase', 'orange'], ['Philanthropic Grant', 'green'], ['Sponsorship', 'blue'], ['Other', 'gray']]);
export const PAYMENT_OPTIONS = opts([['Cash', 'green'], ['Bank', 'blue']]);
export const CONDITION_OPTIONS = opts([['Good', 'green'], ['Fair', 'orange'], ['Poor', 'red']]);
export const IN_KIND = 'In-kind Donation';
export const STATUS_OPTIONS = opts([['Active', 'green'], ['Archived', 'gray']]);
export const ARCHIVED = 'Archived';

/** "FY2026-27" for a yyyy-MM-dd date (financial year 1 Jul – 30 Jun). */
export function financialYearOf(date) {
  if (!date) return '';
  const [y, m] = date.split('-').map(Number);
  const start = m >= 7 ? y : y - 1;
  return `FY${start}-${String(start + 1).slice(2)}`;
}

export const formatCurrency = (v) => (v === '' || v == null ? '' : `$${Number(v).toLocaleString('en-AU', { maximumFractionDigits: 0 })}`);

// Field specs — type: text | select | number | currency | date | description | donor | textarea
export const DONOR_SECTIONS = (f, o = {}) => [
  { title: 'Donor Details', fields: [
    { k: 'donor_code', label: 'Donor ID', required: true, mono: true, type: 'text', placeholder: 'e.g., D-0001' },
    { k: 'donor_name', label: 'Donor Name', required: true, type: 'text', placeholder: 'e.g., Jane Smith' },
    { k: 'donor_type', label: 'Donor Type', type: 'select', options: o.donor_type || DONOR_TYPE_OPTIONS },
    { k: 'abn', label: 'ABN', type: 'text', placeholder: 'e.g., 12 345 678 901' },
    { k: 'email', label: 'Email', type: 'text', placeholder: 'e.g., jane@example.com' },
    { k: 'phone', label: 'Phone', type: 'text', placeholder: 'e.g., 0400 000 000' },
    { k: 'postal_address', label: 'Postal Address', type: 'text', placeholder: 'e.g., PO Box 123, Darwin' },
    { k: 'status', label: 'Status', type: 'select', options: STATUS_OPTIONS },
  ] },
  { title: 'Governance and Risk', fields: [
    { k: 'related_party', label: 'Related Party', type: 'select', options: YES_NO_OPTIONS },
    ...(f.related_party === 'Yes' ? [{ k: 'relationship_nature', label: 'Nature of Relationship', type: 'text', placeholder: 'e.g., Board member’s spouse' }] : []),
    { k: 'due_diligence', label: 'Due Diligence Status', tableLabel: 'Due Diligence', type: 'select', options: DUE_DILIGENCE_OPTIONS },
    { k: 'risk_rating', label: 'Risk Rating', type: 'select', options: RISK_OPTIONS },
  ] },
];

export const DONATION_SECTIONS = (f, o = {}) => [
  { title: 'Donation Details', fields: [
    { k: 'donation_code', label: 'Donation Ref.', type: 'text', placeholder: 'e.g., DON-2026-0001' },
    { k: 'donor_id', label: 'Donor', required: true, type: 'donor' },
    { k: 'donation_type', label: 'Donation Type', type: 'select', options: o.donation_type || DONATION_TYPE_OPTIONS },
    { k: 'date_received', label: 'Date Received', type: 'date' },
    { k: 'description', label: 'Description', type: 'description', full: true },
    { k: 'gross_amount', label: 'Donation Amount ($)', type: 'currency', placeholder: 'e.g., 500' },
    { k: 'payment_method', label: 'Payment Method', type: 'select', options: o.payment_method || PAYMENT_OPTIONS },
    { k: 'financial_year', label: 'Financial Year', type: 'readonly' },
  ] },
  ...(f.donation_type === IN_KIND ? [{ title: 'In-Kind Details', fields: [
    { k: 'inkind_category', label: 'Category', type: 'text', placeholder: 'e.g., IT Equipment' },
    { k: 'inkind_quantity', label: 'Quantity', type: 'number', placeholder: 'e.g., 6' },
    { k: 'inkind_condition', label: 'Condition', type: 'select', options: CONDITION_OPTIONS },
    { k: 'inkind_fair_value', label: 'Fair Value ($)', type: 'currency', placeholder: 'e.g., 1200' },
    { k: 'inkind_valuation_date', label: 'Valuation Date', type: 'date' },
    { k: 'inkind_custodian', label: 'Custodian', type: 'text', placeholder: 'e.g., Main Office / IT Lead' },
  ] }, { title: 'Disposal Information', subtitle: 'Record when and how this in-kind item left the organisation, and any proceeds received.', trailing: true, fields: [
    { k: 'inkind_disposal_date', label: 'Disposal Date', type: 'date' },
    { k: 'inkind_disposal_method', label: 'Disposal Method', type: 'text', placeholder: 'e.g., Auction Sale' },
    { k: 'inkind_sale_proceeds', label: 'Sale Proceeds ($)', type: 'currency', placeholder: 'e.g., 300' },
  ] }] : []),
];

const withIds = (list) => list.map((o, i) => ({ ...o, id: `opt-${i + 1}` }));
/** Editable system fields for a kind — option lists stored on register.config, seeded from defaults. */
const systemConfig = (defs) => ({
  // Built-in options are locked (no rename/delete); only user-added options are editable.
  systemFields: defs.map(({ key, field, label, defaults }) => ({ key, field, label, lockedNames: defaults.map((o) => o.name) })),
  getOptions: (register) => Object.fromEntries(defs.map(({ key, defaults }) => [key, toIdOptions(register?.config?.[key], withIds(defaults))])),
  /** { field: [{ name, color }] } for selects, badges and filters. */
  fieldOptions: (register) => Object.fromEntries(defs.map(({ key, field, defaults }) =>
    [field, toIdOptions(register?.config?.[key], withIds(defaults)).map((x) => ({ name: x.name, color: x.color || 'gray' }))])),
});

const NUMERIC = ['gross_amount', 'inkind_quantity', 'inkind_fair_value', 'inkind_sale_proceeds'];
const INKIND_KEYS = ['inkind_category', 'inkind_quantity', 'inkind_condition', 'inkind_fair_value', 'inkind_valuation_date', 'inkind_custodian', 'inkind_disposal_date', 'inkind_disposal_method', 'inkind_sale_proceeds'];
const DONOR_KEYS = ['donor_code', 'donor_name', 'donor_type', 'abn', 'email', 'phone', 'postal_address', 'status', 'related_party', 'relationship_nature', 'due_diligence', 'risk_rating'];
const DONATION_KEYS = ['donation_code', 'donor_id', 'donation_type', 'description', 'gross_amount', 'date_received', 'financial_year', 'payment_method', ...INKIND_KEYS];

/** Next sequential Donor ID (D-0001 style) from existing donors. */
export function nextDonorId(donors) {
  const max = donors.reduce((m, d) => {
    const match = /^D-(\d+)$/i.exec(d.donor_code || '');
    return match ? Math.max(m, Number(match[1])) : m;
  }, 0);
  return `D-${String(max + 1).padStart(4, '0')}`;
}

const empty = (keys) => () => ({ ...Object.fromEntries(keys.map((k) => [k, ''])), custom_fields: {} });
const pick = (keys) => (r) => ({ ...Object.fromEntries(keys.map((k) => [k, r?.[k] ?? ''])), custom_fields: r?.custom_fields || {} });

/** Strips blanks to null, coerces numbers, clears hidden conditional fields, derives the financial year. */
function normalise(form) {
  const out = { ...form };
  Object.keys(out).forEach((k) => {
    if (k === 'custom_fields') return;
    if (typeof out[k] === 'string') out[k] = out[k].trim();
    if (out[k] === '') out[k] = null;
    else if (NUMERIC.includes(k)) out[k] = Number(out[k]);
  });
  if ('related_party' in out && out.related_party !== 'Yes') out.relationship_nature = null;
  if ('donation_type' in out) {
    out.financial_year = financialYearOf(form.date_received) || null;
    if (out.donation_type !== IN_KIND) INKIND_KEYS.forEach((k) => { out[k] = null; });
  }
  return out;
}

const api = (entity) => ({
  entity,
  list: (registerId) => entity().filter({ register_id: registerId }, '-created_date', 1000),
  create: (registerId, form) => entity().create({ ...normalise(form), register_id: registerId }),
  update: (id, form) => entity().update(id, normalise(form)),
  remove: (ids) => entity().deleteMany({ id: { $in: ids } }),
});

export const donorApi = api(() => base44.entities.Donor);
export const donationApi = api(() => base44.entities.Donation);

export const DONOR_KIND = {
  key: 'donor', label: 'Donor', plural: 'donors', columnsKey: 'donor_custom_columns',
  api: donorApi, sections: DONOR_SECTIONS, empty: () => ({ ...empty(DONOR_KEYS)(), status: 'Active' }),
  pick: (r) => ({ ...pick(DONOR_KEYS)(r), status: r?.status || 'Active' }),
  codeKey: 'donor_code', titleKey: 'donor_name', required: [['donor_code', 'Donor ID is required.'], ['donor_name', 'Donor Name is required.']],
  ...systemConfig([{ key: 'donor_types', field: 'donor_type', label: 'Donor Type', defaults: DONOR_TYPE_OPTIONS }]),
  searchKeys: ['donor_code', 'donor_name', 'email', 'abn'],
  filterFields: [
    { id: 'donor_type', label: 'Donor Type', values: [] },
    { id: 'related_party', label: 'Related Party', values: ['Yes', 'No'] },
    { id: 'due_diligence', label: 'Due Diligence Status', values: DUE_DILIGENCE_OPTIONS.map((o) => o.name) },
    { id: 'risk_rating', label: 'Risk Rating', values: RISK_OPTIONS.map((o) => o.name) },
  ],
  columns: ['donor_name', 'donor_type', 'related_party', 'due_diligence', 'risk_rating', 'status'],
  summary: (items) => [
    { key: 'total', label: 'Total Donors', value: items.length },
    { key: 'related', label: 'Related Parties', value: items.filter((d) => d.related_party === 'Yes').length },
    { key: 'pending', label: 'Due Diligence Pending', value: items.filter((d) => d.due_diligence === 'Pending').length },
    { key: 'high', label: 'High Risk', value: items.filter((d) => d.risk_rating === 'High').length },
  ],
};

export const DONATION_KIND = {
  key: 'donation', label: 'Donation', plural: 'donations', columnsKey: 'donation_custom_columns',
  api: donationApi, sections: DONATION_SECTIONS, empty: empty(DONATION_KEYS), pick: pick(DONATION_KEYS),
  codeKey: 'donation_code', codeLabel: 'Donation Ref.', titleKey: 'donation_code', required: [['donor_id', 'Please select a donor.']],
  ...systemConfig([
    { key: 'donation_types', field: 'donation_type', label: 'Donation Type', defaults: DONATION_TYPE_OPTIONS },
    { key: 'payment_methods', field: 'payment_method', label: 'Payment Method', defaults: PAYMENT_OPTIONS },
  ]),
  searchKeys: ['donor_id'], searchPlaceholder: 'Search by donor...',
  filterFields: [
    { id: 'donation_type', label: 'Donation Type', values: [] },
    { id: 'payment_method', label: 'Payment Method', values: [] },
    { id: 'financial_year', label: 'Financial Year', values: [] },
  ],
  columns: ['donor_id', 'donation_type', 'gross_amount', 'date_received', 'financial_year', 'payment_method'],
  summary: (items) => {
    const fy = financialYearOf(localToday());
    const sum = (list) => formatCurrency(list.reduce((s, d) => s + (Number(d.gross_amount) || 0), 0));
    return [
      { key: 'total', label: 'Total Donations', value: items.length },
      { key: 'gross', label: 'Total Donation Amount', value: sum(items) },
      { key: 'fy', label: `This Financial Year (${fy})`, value: sum(items.filter((d) => d.financial_year === fy)) },
      { key: 'inkind', label: 'In-kind Donations', value: items.filter((d) => d.donation_type === IN_KIND).length },
    ];
  },
};

/** Donations inside one donor's profile — the donor is implied, so its field, column and search are dropped. */
export const DONOR_DONATION_KIND = {
  ...DONATION_KIND,
  sections: (f, o) => DONATION_SECTIONS(f, o).map((s) => ({ ...s, fields: s.fields.filter((x) => x.k !== 'donor_id') })),
  columns: ['donation_code', ...DONATION_KIND.columns.filter((k) => k !== 'donor_id')],
  searchKeys: ['donation_code', 'donation_type', 'payment_method', 'financial_year'], searchPlaceholder: 'Search donations...',
};

/** Per-field validation: required messages (once `showRequired`) plus live duplicate-ID checks. */
export function recordErrors(kind, form, items, selfId, showRequired) {
  const errs = {};
  if (showRequired) kind.required.forEach(([k, msg]) => { if (!String(form[k] || '').trim()) errs[k] = msg; });
  const code = String(form[kind.codeKey] || '').trim();
  if (code && items.some((r) => r.id !== selfId && r[kind.codeKey] === code)) errs[kind.codeKey] = `${kind.codeLabel || `${kind.label} ID`} "${code}" is already in use.`;
  return errs;
}

/** Every field spec for a kind (conditional sections forced on) — used for labels, table and export. */
export function allFields(kind, o) {
  const forced = kind.key === 'donor' ? { related_party: 'Yes' } : { donation_type: IN_KIND };
  return kind.sections(forced, o).flatMap((s) => s.fields);
}

/** Plain display text for a field value; donor ids resolve through donorName. */
export function displayValue(field, value, donorName) {
  if (value === '' || value == null) return '';
  if (field.type === 'donor') return donorName(value);
  if (field.type === 'currency') return formatCurrency(value);
  if (field.type === 'date') return format(parseISO(value), 'd MMM yyyy');
  return String(value);
}

export function filterRecords(kind, items, { search, filters }, donorName) {
  const q = search.trim().toLowerCase();
  return items.filter((r) =>
    (!q || kind.searchKeys.some((k) => String((k === 'donor_id' ? donorName(r[k]) : r[k]) || '').toLowerCase().includes(q))) &&
    Object.entries(filters).every(([k, v]) => r[k] === v));
}