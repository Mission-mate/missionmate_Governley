/**
 * Mapping helpers between the MembershipStructure entity and the wizard form.
 *
 * Keeps backward compatibility with existing Member logic (lib/membership.js
 * calculateExpirationDate) by always deriving `is_lifetime` and
 * `duration_months` from the chosen renewal period.
 */
import { normalizeAppFields } from '@/lib/membershipApplication';

const RENEWAL_PERIOD_MONTHS = {
  Annually: 12,
  'One-off': 12,
};

export const RENEWAL_PERIODS = [
  'One-off',
  'Annually',
  'Lifetime (No Expiration)',
  'Every',
];

export const RENEWAL_INTERVAL_UNITS = ['Months', 'Years'];

/** Hard ceiling on a renewal cadence — 10 years. */
export const RENEWAL_MAX_MONTHS = 120;

/** True when the value is one of the canonical, currently-supported periods. */
export const isSupportedRenewalPeriod = (p) => RENEWAL_PERIODS.includes(p);

/** Months in one 'Every' cycle, e.g. (3, 'Years') -> 36. */
const intervalToMonths = (value, unit) =>
  (Number(value) || 1) * (unit === 'Years' ? 12 : 1);

/**
 * Validation message for the 'Every' renewal interval, or '' when valid.
 * Shared by the inline field validation and the save-time guard.
 */
export const renewalIntervalError = (form) => {
  if (form?.renewal_period !== 'Every') return '';
  const raw = form.renewal_interval_value;
  const value = Number(raw);
  if (raw === '' || raw === null || raw === undefined || !Number.isFinite(value) || value < 1) {
    return 'Enter how often this membership renews (1 or more).';
  }
  if (intervalToMonths(value, form.renewal_interval_unit) > RENEWAL_MAX_MONTHS) {
    return `The renewal period cannot exceed 10 years (${RENEWAL_MAX_MONTHS} months).`;
  }
  return '';
};

/** Readable renewal period for display, e.g. "Every 3 Years". */
export const renewalPeriodLabel = (s) => {
  if (!s) return '–';
  if (s.is_lifetime) return 'Lifetime (No Expiration)';
  if (s.renewal_period === 'Every') {
    const value = Number(s.renewal_interval_value) || 1;
    const unit = s.renewal_interval_unit === 'Years' ? 'Years' : 'Months';
    return `Every ${value} ${value === 1 ? unit.slice(0, -1) : unit}`;
  }
  return s.renewal_period || '–';
};

export const RENEWAL_CALCULATIONS = [
  'Based on date joined',
  'Fixed renewal date',
  'Financial year cycle',
  'Calendar year cycle',
];

export const GRACE_PERIOD_OPTIONS = [
  { value: 0, label: 'No grace period' },
  { value: 14, label: '14 Days' },
  { value: 30, label: '30 Days' },
  { value: 60, label: '60 Days' },
  { value: 90, label: '90 Days' },
];

export const AFTER_GRACE_OPTIONS = [
  'Mark as expired',
  'Keep active until admin review',
];

export const FEE_TYPES = ['Free', 'Fixed', 'Tiered', 'Custom'];

export const PAYMENT_METHODS = ['Cash', 'Bank Transfer', 'Online Payment', 'Invoice'];

// Legacy fee_type values → new values.
const normalizeFeeType = (s) => {
  const t = s?.fee_type;
  if (!t || t === 'No Membership Fee') return 'Free';
  if (FEE_TYPES.includes(t)) return t;
  return 'Free';
};

/** Reads the stored renewal period, falling back to Annually when unset. */
const normalizeRenewalPeriod = (s) => {
  if (s?.is_lifetime) return 'Lifetime (No Expiration)';
  const p = s?.renewal_period;
  return isSupportedRenewalPeriod(p) ? p : 'Annually';
};

/** Resolve the 'Every' interval for a stored structure. */
const deriveInterval = (s) => ({
  renewal_interval_value: Number(s?.renewal_interval_value) || 1,
  renewal_interval_unit: s?.renewal_interval_unit === 'Years' ? 'Years' : 'Months',
});

const normalizePaymentMethods = (s) => {
  if (Array.isArray(s?.payment_methods) && s.payment_methods.length) return s.payment_methods;
  // Migrate legacy single method.
  if (s?.payment_method === 'Bank Transfer') return ['Bank Transfer'];
  if (s?.payment_method === 'Payment Link') return ['Online Payment'];
  if (s?.payment_method === 'Cash') return ['Cash'];
  return [];
};

const normalizeRenewalCalc = (s) => {
  if (s?.renewal_calculation && RENEWAL_CALCULATIONS.includes(s.renewal_calculation)) {
    return s.renewal_calculation;
  }
  if (s?.renewal_expiration_type === 'On Specific Date') return 'Fixed renewal date';
  return 'Based on date joined';
};

export const structureToForm = (s) => ({
  name: s?.name || '',
  description: s?.description || '',
  application_fields: normalizeAppFields(s?.application_fields),
  plan_content_sections: Array.isArray(s?.plan_content_sections) ? s.plan_content_sections : [],
  has_tiers: !!s?.has_tiers,
  tier_fees_differ: !!s?.tier_fees_differ,
  tiers: (Array.isArray(s?.tiers) ? s.tiers : []).map((t) => ({
    ...t,
    one_time_payment_link: t?.one_time_payment_link || t?.payment_link || '',
    recurrent_payment_link: t?.recurrent_payment_link || '',
  })),
  // Fees & payment
  fee_type: normalizeFeeType(s),
  fee_amount: s?.fee_amount ?? 0,
  payment_methods: normalizePaymentMethods(s),
  payment_link: s?.payment_link || '',
  online_payment_type: s?.online_payment_type === 'both' ? 'both' : 'one_time',
  // Fall back to the legacy single payment_link as the one-time link.
  one_time_payment_link: s?.one_time_payment_link || s?.payment_link || '',
  recurrent_payment_link: s?.recurrent_payment_link || '',
  bank_account_name: s?.bank_account_name || '',
  bank_bsb: s?.bank_bsb || '',
  bank_account_number: s?.bank_account_number || '',
  bank_payment_reference: s?.bank_payment_reference || '',
  show_pay_id: !!s?.show_pay_id,
  pay_id: s?.pay_id || '',
  // Renewal & expiry
  renewal_period: normalizeRenewalPeriod(s),
  ...deriveInterval(s),
  renewal_calculation: normalizeRenewalCalc(s),
  specific_expiration_day: s?.specific_expiration_day || 1,
  specific_expiration_month: s?.specific_expiration_month || 1,
  grace_period_days: s?.grace_period_days ?? 0,
  after_grace_period: s?.after_grace_period || 'Mark as expired',
  // Workflow / notifications — approval is a system default (always on). New plans
  // default the notification toggles on; existing plans keep their stored values.
  admin_approval_required: true,
  welcome_email_enabled: s ? !!s.welcome_email_enabled : true,
  renewal_reminder_enabled: s ? !!s.renewal_reminder_enabled : true,
  expiry_reminder_enabled: s ? !!s.expiry_reminder_enabled : true,
});

/** Derive duration in months from the renewal configuration. */
const deriveDurationMonths = (form) => {
  if (form.renewal_period === 'Lifetime (No Expiration)') return 0;
  if (form.renewal_period === 'Every') {
    return intervalToMonths(form.renewal_interval_value, form.renewal_interval_unit);
  }
  return RENEWAL_PERIOD_MONTHS[form.renewal_period] ?? 12;
};

export const formToStructure = (form) => {
  const isLifetime = form.renewal_period === 'Lifetime (No Expiration)';
  const feeType = form.fee_type || 'Free';
  const methods = form.payment_methods || [];
  const hasBank = methods.includes('Bank Transfer');
  const hasOnline = methods.includes('Online Payment');
  const isPaid = feeType !== 'Free';
  const onlineType = form.online_payment_type === 'both' ? 'both' : 'one_time';
  const oneTimeLink = isPaid && hasOnline ? (form.one_time_payment_link?.trim() || '') : '';
  const recurrentLink = isPaid && hasOnline && onlineType === 'both' ? (form.recurrent_payment_link?.trim() || '') : '';

  return {
    name: form.name.trim(),
    description: form.description?.trim() || '',
    application_fields: normalizeAppFields(form.application_fields),
    plan_content_sections: (form.plan_content_sections || [])
      .filter((sec) => (sec.title && sec.title.trim()) || (sec.content && sec.content.trim()))
      .map((sec) => ({ id: sec.id, title: sec.title?.trim() || '', content: sec.content || '' })),
    has_tiers: !!form.has_tiers,
    tier_fees_differ: !!form.has_tiers && (!!form.tier_fees_differ || feeType === 'Tiered'),
    tiers: form.has_tiers
      ? (form.tiers || []).filter((t) => t.name && t.name.trim()).map((t) => {
          const tierOneTime = (t.one_time_payment_link ?? t.payment_link ?? '').trim();
          const tierRecurrent = onlineType === 'both' ? (t.recurrent_payment_link || '').trim() : '';
          return {
            id: t.id,
            name: t.name.trim(),
            description: t.description?.trim() || '',
            fee_amount: Number(t.fee_amount) || 0,
            one_time_payment_link: tierOneTime,
            recurrent_payment_link: tierRecurrent,
            // Keep legacy payment_link in sync with the one-time link.
            payment_link: tierOneTime,
          };
        })
      : [],
    // Fees & payment
    fee_type: feeType,
    fee_amount: (feeType === 'Fixed' || feeType === 'Custom') ? Number(form.fee_amount) || 0 : 0,
    payment_methods: isPaid ? methods : [],
    online_payment_type: isPaid && hasOnline ? onlineType : 'one_time',
    one_time_payment_link: oneTimeLink,
    recurrent_payment_link: recurrentLink,
    // Keep legacy payment_link in sync with the one-time link for backward compatibility.
    payment_link: oneTimeLink,
    bank_account_name: isPaid && hasBank ? (form.bank_account_name?.trim() || '') : '',
    bank_bsb: isPaid && hasBank ? (form.bank_bsb?.trim() || '') : '',
    bank_account_number: isPaid && hasBank ? (form.bank_account_number?.trim() || '') : '',
    bank_payment_reference: isPaid && hasBank ? (form.bank_payment_reference?.trim() || '') : '',
    show_pay_id: isPaid && hasBank ? !!form.show_pay_id : false,
    pay_id: isPaid && hasBank && form.show_pay_id ? (form.pay_id?.trim() || '') : '',
    // Renewal & expiry
    renewal_period: form.renewal_period,
    renewal_interval_value: Number(form.renewal_interval_value) || 1,
    renewal_interval_unit: form.renewal_interval_unit === 'Years' ? 'Years' : 'Months',
    renewal_calculation: isLifetime ? 'Based on date joined' : form.renewal_calculation,
    specific_expiration_day: Number(form.specific_expiration_day) || 1,
    specific_expiration_month: Number(form.specific_expiration_month) || 1,
    grace_period_days: isLifetime ? 0 : (Number(form.grace_period_days) || 0),
    after_grace_period: form.after_grace_period || 'Mark as expired',
    is_lifetime: isLifetime,
    duration_months: deriveDurationMonths(form),
    // Retained fields
    admin_approval_required: !!form.admin_approval_required,
    welcome_email_enabled: !!form.welcome_email_enabled,
    renewal_reminder_enabled: !!form.renewal_reminder_enabled,
    expiry_reminder_enabled: !!form.expiry_reminder_enabled,
  };
};