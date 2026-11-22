import { base44 } from '@/api/base44Client';
import { financialYearOf } from '@/lib/donorRegister';

export const GIFT_OBJECT_TYPE = 'gift_benefit';
export const GIFT_TYPE_OPTIONS = [{ name: 'Gift', color: 'purple' }, { name: 'Benefit', color: 'blue' }];
export const COI_OPTIONS = [
  { name: 'Actual', color: 'red' }, { name: 'Perceived', color: 'orange' },
  { name: 'Potential', color: 'purple' }, { name: 'No Conflict of Interest', label: 'No COI', color: 'green' },
];
/** Display label for an option value (stored value stays unchanged). */
export const optionLabel = (options, v) => options.find((o) => o.name === v)?.label || v;
export const APPROVAL_OPTIONS = [
  { name: 'Approved', color: 'green' }, { name: 'Approved with Conditions', color: 'blue' },
  { name: 'Not Approved', color: 'red' }, { name: 'Pending Decision', color: 'orange' }, { name: 'Not Required', color: 'gray' },
];
export const hasConflict = (v) => ['Actual', 'Perceived', 'Potential'].includes(v);

export const GIFT_FILTER_FIELDS = [
  { id: 'conflict_of_interest', label: 'Conflict of Interest', values: COI_OPTIONS.map((o) => o.name), labels: { 'No Conflict of Interest': 'No COI' } },
  { id: 'approval_decision', label: 'Approval Decision', values: APPROVAL_OPTIONS.map((o) => o.name) },
];

export const emptyGift = () => ({
  record_code: '', date_received: '', gift_type: '', title: '', description: '', reason: '', presented_by: '', relationship_nature: '', received_by: '',
  estimated_value: '', conflict_of_interest: '', conflict_details: '', declaration_date: '', approval_decision: '', approved_by: '',
});
export const pickGift = (g) => Object.fromEntries(Object.keys(emptyGift()).map((k) => [k, g?.[k] ?? '']));
export { financialYearOf };

const CODE_RE = /^GBH-(\d+)$/i;
/** Next GBH-### after the highest existing numeric code in the register. */
export async function nextGiftCode(registerId) {
  const page = await base44.entities.GiftBenefit.filter({ register_id: registerId }, { limit: 1000, fields: ['record_code'] });
  const max = (page.items || []).reduce((m, g) => Math.max(m, Number(CODE_RE.exec(g.record_code || '')?.[1] || 0)), 0);
  return `GBH-${String(max + 1).padStart(3, '0')}`;
}

const REQUIRED = [['record_code', 'Record ID'], ['date_received', 'Date Received'], ['gift_type', 'Type'], ['title', 'Title of Gift/Benefit'], ['description', 'Description of Gift/Benefit'], ['presented_by', 'Presented By'], ['conflict_of_interest', 'Conflict of Interest']];

/** Returns an error message, or '' when the form is valid and its Record ID is unique. */
export const giftFieldErrors = (form) =>
  Object.fromEntries(REQUIRED.filter(([k]) => !String(form[k] ?? '').trim()).map(([k, l]) => [k, `${l} is required.`]));

/** Server check: { record_code } when the Record ID is already used in the register. */
export async function giftCodeErrors(registerId, form, selfId) {
  const code = form.record_code.trim();
  const dupes = await base44.entities.GiftBenefit.filter({ register_id: registerId, record_code: code }, { limit: 2, fields: ['id'] });
  return (dupes.items || []).some((d) => d.id !== selfId) ? { record_code: `Record ID ${code} is already in use.` } : {};
}

const toRecord = (form) => ({
  ...form,
  record_code: form.record_code.trim(),
  estimated_value: form.estimated_value === '' ? null : Number(form.estimated_value),
  conflict_details: hasConflict(form.conflict_of_interest) ? form.conflict_details : '',
  financial_year: financialYearOf(form.date_received) || '',
  declaration_date: form.declaration_date || null,
});

export const listGifts = (registerId) => base44.entities.GiftBenefit.filter({ register_id: registerId }, '-date_received', 1000);
export const createGift = (registerId, form) => base44.entities.GiftBenefit.create({ ...toRecord(form), register_id: registerId });
export const updateGift = (id, form) => base44.entities.GiftBenefit.update(id, toRecord(form));
export const deleteGifts = async (ids) => {
  const scope = { object_type: GIFT_OBJECT_TYPE, object_id: { $in: ids } };
  await Promise.all([
    base44.entities.NotePage.deleteMany(scope),
    base44.entities.Document.deleteMany(scope),
    base44.entities.DocumentFolder.deleteMany(scope),
  ]);
  return base44.entities.GiftBenefit.deleteMany({ id: { $in: ids } });
};

export const formatMoney = (v) => (v === '' || v == null ? '' : Number(v).toLocaleString('en-AU', { style: 'currency', currency: 'AUD' }));

export const formatMoneyWhole = (v) => Number(v || 0).toLocaleString('en-AU', { style: 'currency', currency: 'AUD', maximumFractionDigits: 0 });

export function filterGifts(items, { type, search, filters }) {
  const q = search.trim().toLowerCase();
  return items.filter((g) =>
    (type === 'All' || g.gift_type === type) &&
    (!q || [g.record_code, g.title, g.description, g.presented_by, g.received_by].some((v) => (v || '').toLowerCase().includes(q))) &&
    Object.entries(filters).every(([k, v]) => g[k] === v));
}