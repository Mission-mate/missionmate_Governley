/**
 * Mandatory-field validity per step of the Membership Plan wizard.
 * Pure — derived only from the wizard form state.
 */
import { isSupportedRenewalPeriod, renewalIntervalError } from '@/lib/membershipStructures';

const detailsValid = (form) => !!form.name?.trim();

const renewalValid = (form) => {
  if (!isSupportedRenewalPeriod(form.renewal_period)) return false;
  if (renewalIntervalError(form)) return false;
  if (form.renewal_period === 'Lifetime (No Expiration)') return true;
  if (!form.renewal_calculation) return false;
  if (!Number.isFinite(Number(form.grace_period_days))) return false;
  if (!form.after_grace_period) return false;
  return true;
};

const feesValid = (form) => {
  if (!form.fee_type) return false;
  if (form.fee_type === 'Free') return true;
  const methods = form.payment_methods || [];

  if (methods.includes('Bank Transfer')) {
    if (!form.bank_account_name?.trim() || !form.bank_bsb?.trim() || !form.bank_account_number?.trim()) {
      return false;
    }
  }

  if (methods.includes('Online Payment')) {
    const bothTypes = form.online_payment_type === 'both';
    if (form.fee_type === 'Tiered' && form.has_tiers) {
      const paidTiers = (form.tiers || []).filter((t) => Number(t.fee_amount) > 0);
      if (paidTiers.some((t) => !(t.one_time_payment_link ?? t.payment_link ?? '').trim())) return false;
      if (bothTypes && paidTiers.some((t) => !t.recurrent_payment_link?.trim())) return false;
    } else {
      if (!form.one_time_payment_link?.trim()) return false;
      if (bothTypes && !form.recurrent_payment_link?.trim()) return false;
    }
  }

  return true;
};

/** Validity of each wizard step, keyed by tab value. */
export const stepValidity = (form) => ({
  details: detailsValid(form),
  renewal: renewalValid(form),
  fees: feesValid(form),
  // Approvals & notifications are toggles only — nothing mandatory.
  workflow: true,
});

export const allStepsValid = (validity) => Object.values(validity).every(Boolean);