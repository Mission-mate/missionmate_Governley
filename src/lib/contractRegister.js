import { base44 } from '@/api/base44Client';
import { parseAmount } from '@/lib/financials';
import { toIdOptions } from '@/lib/configNormalize';

export const CONTRACT_OBJECT_TYPE = 'contract';
const DEFAULT_CONTRACT_TYPES = [
  { name: 'Funding agreement', color: 'green' }, { name: 'Supplier or service contract', color: 'blue' },
  { name: 'Lease or property agreement', color: 'gray' }, { name: 'Memorandum of understanding', color: 'orange' },
  { name: 'Consultancy agreement', color: 'blue' }, { name: 'Software or licence agreement', color: 'purple' },
  { name: 'Employment contract (fixed-term or executive)', color: 'purple' }, { name: 'Sub-grant to another organisation', color: 'green' },
  { name: 'Partnership agreement', color: 'orange' }, { name: 'Other', color: 'gray' },
].map((o, i) => ({ ...o, id: `ctype-${i + 1}` }));

/** Per-register Type options (Customise Fields), seeded with the default contract types. */
export const getContractOptions = (register) => ({ contract_types: toIdOptions(register?.config?.contract_types, DEFAULT_CONTRACT_TYPES) });
export const getContractTypes = (register) => getContractOptions(register).contract_types;
export const CONTRACT_TYPE_FIELDS = [{ key: 'contract_types', field: 'contract_type', label: 'Type' }];

export const CONTRACT_STATUS_OPTIONS = [{ name: 'Active', color: 'green' }, { name: 'Archived', color: 'gray' }];
export const contractFilterFields = (register) => [{ id: 'contract_type', label: 'Type', values: getContractTypes(register).map((o) => o.name) }];

export const AMOUNT_ERROR = 'Enter a valid amount — numbers only, zero or greater.';

/** Grant-style schedule maths: invalid amounts first, then total vs schedule mismatch. */
export function scheduleCheck(f) {
  const parsedTotal = parseAmount(f.value);
  const parsedRows = (f.payment_schedule || []).map((r) => parseAmount(r.amount));
  const total = parsedTotal ?? 0;
  const scheduleTotal = parsedRows.reduce((s, a) => s + (a ?? 0), 0);
  const diff = total - scheduleTotal;
  return {
    parsedTotal, parsedRows, total, scheduleTotal, diff,
    hasInvalid: parsedTotal === null || parsedRows.some((a) => a === null),
    hasBreakdown: parsedRows.some((a) => (a ?? 0) > 0),
    matches: !total || Math.abs(diff) < 0.005,
  };
}

/** Financial step errors, keyed to the payment schedule. */
export function financialErrors(f) {
  if (!f.has_financial_value) return {};
  const c = scheduleCheck(f);
  if (c.hasInvalid) return { payment_schedule: AMOUNT_ERROR };
  if (!c.matches) return { payment_schedule: 'Payment Schedule must equal the Contract Value.' };
  return {};
}

export const emptyContract = () => ({
  contract_code: '', title: '', description: '', contract_type: '', start_date: '', expiry_date: '',
  has_financial_value: false, value: '', payment_schedule: [],
  review_frequency: '', interval_value: '', interval_unit: '', last_review_date: '', next_review_date: '',
  owner: '', manager: '', business_division: '', status: 'Active', party_name: '', party_contact: '', party_email: '', party_phone: '',
  additional_parties: [], custom_fields: {},
});
export const MAX_ADDITIONAL_PARTIES = 3;
export const PARTY_KEYS = ['party_name', 'party_contact', 'party_email', 'party_phone'];
export const emptyParty = () => Object.fromEntries(PARTY_KEYS.map((k) => [k, '']));
export const pickContract = (c) => {
  const base = emptyContract();
  const f = Object.fromEntries(Object.keys(base).map((k) => [k, c?.[k] ?? base[k]]));
  return {
    ...f, value: c?.value ?? '', has_financial_value: !!c?.has_financial_value,
    payment_schedule: (c?.payment_schedule || []).map((r) => ({ label: r.label || '', amount: r.amount ?? '' })),
    additional_parties: (c?.additional_parties || []).map((p) => ({ ...emptyParty(), ...p })),
    custom_fields: c?.custom_fields || {},
  };
};

const CODE_RE = /^CON-(\d+)$/i;
export async function nextContractCode(registerId) {
  const page = await base44.entities.Contract.filter({ register_id: registerId }, { limit: 1000, fields: ['contract_code'] });
  const max = (page.items || []).reduce((m, c) => Math.max(m, Number(CODE_RE.exec(c.contract_code || '')?.[1] || 0)), 0);
  return `CON-${String(max + 1).padStart(3, '0')}`;
}

const REQUIRED = [['contract_code', 'Contract Reference'], ['title', 'Contract Title']];

/** Details/dates field errors (sync). */
export function contractDetailErrors(form) {
  const e = Object.fromEntries(REQUIRED.filter(([k]) => !String(form[k] ?? '').trim()).map(([k, l]) => [k, `${l} is required.`]));
  if (form.start_date && form.expiry_date && form.expiry_date < form.start_date) e.expiry_date = 'Expiry Date cannot be before Start Date.';
  return e;
}
export const contractFieldErrors = (form) => ({ ...contractDetailErrors(form), ...financialErrors(form) });

/** Server check: { contract_code } when the reference is already used in the register. */
export async function contractCodeErrors(registerId, form, selfId) {
  const code = form.contract_code.trim();
  const dupes = await base44.entities.Contract.filter({ register_id: registerId, contract_code: code }, { limit: 2, fields: ['id'] });
  return (dupes.items || []).some((d) => d.id !== selfId) ? { contract_code: `Contract Reference ${code} is already in use.` } : {};
}

const num = (v) => (v === '' || v == null ? null : Number(v));
const toRecord = (f) => ({
  ...f, contract_code: f.contract_code.trim(), status: f.status || 'Active',
  has_financial_value: !!f.has_financial_value,
  value: f.has_financial_value ? num(f.value) : null,
  payment_schedule: f.has_financial_value
    ? f.payment_schedule.filter((r) => r.label.trim() || r.amount !== '').map((r) => ({ label: r.label.trim(), amount: num(r.amount) ?? 0 }))
    : [],
  contract_type: f.contract_type || null, review_frequency: f.review_frequency || null,
  interval_value: f.review_frequency === 'Every' ? num(f.interval_value) : null,
  interval_unit: f.review_frequency === 'Every' ? f.interval_unit || null : null,
  additional_parties: f.additional_parties
    .map((p) => Object.fromEntries(PARTY_KEYS.map((k) => [k, (p[k] || '').trim()])))
    .filter((p) => PARTY_KEYS.some((k) => p[k])),
  start_date: f.start_date || null, expiry_date: f.expiry_date || null, last_review_date: f.last_review_date || null, next_review_date: f.next_review_date || null,
});

export const listContracts = (registerId) => base44.entities.Contract.filter({ register_id: registerId }, '-start_date', 1000);
export const createContract = (registerId, form) => base44.entities.Contract.create({ ...toRecord(form), register_id: registerId });
export const updateContract = (id, form) => base44.entities.Contract.update(id, toRecord(form));
export const setContractsStatus = (ids, status) => base44.entities.Contract.updateMany({ id: { $in: ids } }, { $set: { status } });
export const deleteContracts = async (ids) => {
  const scope = { object_type: CONTRACT_OBJECT_TYPE, object_id: { $in: ids } };
  const variations = await base44.entities.ContractVariation.filter({ contract_id: { $in: ids } }, null, 5000);
  const obligations = await base44.entities.ContractObligation.filter({ contract_id: { $in: ids } }, null, 5000);
  if (obligations.length) {
    const obScope = { object_type: 'contract_obligation', object_id: { $in: obligations.map((o) => o.id) } };
    await Promise.all([
      base44.entities.NotePage.deleteMany(obScope),
      base44.entities.Document.deleteMany(obScope),
      base44.entities.DocumentFolder.deleteMany(obScope),
      base44.entities.ContractObligation.deleteMany({ contract_id: { $in: ids } }),
    ]);
  }
  if (variations.length) {
    await base44.entities.NotePage.deleteMany({ object_type: 'contract_variation', object_id: { $in: variations.map((v) => v.id) } });
  }
  await Promise.all([
    base44.entities.NotePage.deleteMany(scope),
    base44.entities.Document.deleteMany(scope),
    base44.entities.DocumentFolder.deleteMany(scope),
    base44.entities.ContractVariation.deleteMany({ contract_id: { $in: ids } }),
  ]);
  return base44.entities.Contract.deleteMany({ id: { $in: ids } });
};

export function filterContracts(items, { status, search, filters }) {
  const q = search.trim().toLowerCase();
  return items.filter((c) =>
    (c.status || 'Active') === status &&
    (!q || [c.contract_code, c.title, c.description, c.owner, c.manager, c.party_name].some((v) => (v || '').toLowerCase().includes(q))) &&
    Object.entries(filters).every(([k, v]) => c[k] === v));
}