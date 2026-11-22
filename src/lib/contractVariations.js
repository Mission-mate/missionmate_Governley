import { base44 } from '@/api/base44Client';
import { localToday } from '@/lib/localClock';

export const VARIATION_OBJECT_TYPE = 'contract_variation';
export const variationsKey = (contractId) => ['contractVariations', contractId];
export const VARIATION_STATUS_OPTIONS = [{ name: 'Current', color: 'green' }, { name: 'Superseded', color: 'gray' }];

export const emptyVariation = () => ({
  title: '', description: '', change_in_value: '', variation_date: localToday(), new_expiry_date: '', approved_by: '', status: 'Current',
});
export const pickVariation = (v) => ({
  title: v.title || '', description: v.description || '', change_in_value: v.change_in_value ?? '',
  variation_date: v.variation_date || '', new_expiry_date: v.new_expiry_date || '', approved_by: v.approved_by || '',
  status: v.status || 'Superseded',
});

const num = (v) => (v === '' || v == null ? null : Number(v));

export function variationErrors(f) {
  const e = {};
  if (!f.title.trim()) e.title = 'Variation Title is required.';
  if (f.change_in_value !== '' && !Number.isFinite(Number(f.change_in_value))) e.change_in_value = 'Change in Value must be a number.';
  return e;
}

const toRecord = (f) => ({
  title: f.title.trim(), description: f.description.trim(), change_in_value: num(f.change_in_value),
  variation_date: f.variation_date || null, new_expiry_date: f.new_expiry_date || null, approved_by: f.approved_by.trim(),
  status: f.status || 'Superseded',
});

export const listVariations = (contractId) =>
  base44.entities.ContractVariation.filter({ contract_id: contractId }, '-variation_date', 500);
export const countVariations = (contractId) => base44.entities.ContractVariation.count({ contract_id: contractId });

const appliedValue = (v) => (v?.applied_to_contract ? Number(v.applied_value ?? v.change_in_value ?? 0) : 0);

/**
 * What applying this save to the contract would change. Only a Current variation updates the
 * contract; for one already applied, only the difference from what was applied is used.
 */
export function pendingContractChange(form, existing, contract) {
  if (form.status !== 'Current') return null;
  const delta = Number(num(form.change_in_value) || 0) - appliedValue(existing);
  const expiry = form.new_expiry_date && form.new_expiry_date !== contract.expiry_date ? form.new_expiry_date : '';
  return delta || expiry ? { delta, expiry } : null;
}

export async function saveVariation({ contract, existing, form, apply }) {
  const record = toRecord(form);
  const change = apply && pendingContractChange(form, existing, contract);
  const tracking = {
    applied_to_contract: !!(existing?.applied_to_contract || change),
    applied_value: appliedValue(existing) + (change?.delta || 0),
    previous_expiry_date: existing?.previous_expiry_date || null,
  };
  if (change) {
    const patch = {};
    if (change.delta) Object.assign(patch, { has_financial_value: true, value: Number(contract.value || 0) + change.delta });
    if (change.expiry) {
      patch.expiry_date = change.expiry;
      if (!tracking.previous_expiry_date) tracking.previous_expiry_date = contract.expiry_date || null;
    }
    await base44.entities.Contract.update(contract.id, patch);
  }
  const saved = existing
    ? await base44.entities.ContractVariation.update(existing.id, { ...record, ...tracking })
    : await base44.entities.ContractVariation.create({ ...record, ...tracking, contract_id: contract.id, register_id: contract.register_id });
  if (record.status === 'Current') {
    await base44.entities.ContractVariation.updateMany(
      { contract_id: contract.id, status: 'Current', id: { $ne: saved.id } },
      { $set: { status: 'Superseded' } },
    );
  }
  return saved;
}

/** What deleting this variation would revert on the contract (Current + applied only). */
export function revertChange(variation, contract) {
  if (variation?.status !== 'Current' || !variation.applied_to_contract) return null;
  const delta = -appliedValue(variation);
  const expiry = variation.new_expiry_date && contract.expiry_date === variation.new_expiry_date ? (variation.previous_expiry_date || '') : '';
  const restoreExpiry = !!expiry || (!!variation.new_expiry_date && contract.expiry_date === variation.new_expiry_date && !variation.previous_expiry_date);
  return delta || restoreExpiry ? { delta, expiry, clearExpiry: restoreExpiry && !expiry } : null;
}

export async function deleteVariation(variation, contract, revert) {
  const change = revert && revertChange(variation, contract);
  if (change) {
    const patch = {};
    if (change.delta) patch.value = Number(contract.value || 0) + change.delta;
    if (change.expiry || change.clearExpiry) patch.expiry_date = change.expiry || null;
    await base44.entities.Contract.update(contract.id, patch);
  }
  await base44.entities.NotePage.deleteMany({ object_type: VARIATION_OBJECT_TYPE, object_id: variation.id });
  return base44.entities.ContractVariation.delete(variation.id);
}