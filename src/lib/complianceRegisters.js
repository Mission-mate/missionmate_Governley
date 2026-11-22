import { base44 } from '@/api/base44Client';
import { differenceInCalendarDays, parseISO, format, addMonths, addYears } from 'date-fns';
import { defaultAssetConfig } from '@/lib/assetRegister';
import { localToday } from '@/lib/localClock';
import { createCategoryStore, PROTECTED_CATEGORY } from '@/lib/categoryStore';

/**
 * Compliance Management → Register sub-module.
 * Fully separate from the legacy Register Management module: registers live in
 * their own ComplianceManagedRegister entity and categories in their own AppConfig key.
 */

export const CATEGORIES_KEY = 'compliance_register_categories';
export const DEFAULT_CATEGORIES = ['Governance', 'Finance', 'Human Resources', 'Operations'];

export const REVIEW_FREQUENCIES = ['Monthly', 'Quarterly', 'Biannually', 'Annually', 'Every', 'Ad Hoc'];

export const STATUSES = [
  { value: 'active', label: 'Active' },
  { value: 'archived', label: 'Archived' },
];

export const todayISO = localToday;

/** Next review date from a base date + frequency. Returns null for Ad Hoc / unset. */
export function calcNextReviewDate(frequency, { baseDate = new Date(), intervalValue, intervalUnit } = {}) {
  if (!baseDate) return null;
  const base = typeof baseDate === 'string' ? parseISO(baseDate) : baseDate;
  let result;
  switch (frequency) {
    case 'Monthly': result = addMonths(base, 1); break;
    case 'Quarterly': result = addMonths(base, 3); break;
    case 'Biannually': result = addMonths(base, 6); break;
    case 'Annually': result = addYears(base, 1); break;
    case 'Every': {
      const n = Number(intervalValue) || 0;
      if (n <= 0) return null;
      result = intervalUnit === 'Years' ? addYears(base, n) : addMonths(base, n);
      break;
    }
    default: return null; // Ad Hoc or unset
  }
  return format(result, 'yyyy-MM-dd');
}

// ── Categories ────────────────────────────────────────────────────────────

export const registerCategoryStore = createCategoryStore({
  key: CATEGORIES_KEY, entity: 'ComplianceManagedRegister', defaults: DEFAULT_CATEGORIES,
});
export const { getCategories } = registerCategoryStore;
export { PROTECTED_CATEGORY };

// ── Registers ─────────────────────────────────────────────────────────────

export function listRegisters() {
  return base44.entities.ComplianceManagedRegister.list('-created_date');
}

function normalise(form) {
  const status = form.status || 'active';
  const isEvery = form.review_frequency === 'Every';
  return {
    title: (form.title || '').trim(),
    category: form.category || '',
    owner: (form.owner || '').trim(),
    review_frequency: form.review_frequency || '',
    interval_value: isEvery ? (Number(form.interval_value) || null) : null,
    interval_unit: isEvery ? (form.interval_unit || 'Months') : null,
    last_review_date: form.last_review_date || null,
    next_review_date: form.next_review_date || null,
    status,
    register_type: form.register_type || '',
  };
}

export function createRegister(form) {
  const data = normalise(form);
  if (data.register_type === 'asset') data.config = defaultAssetConfig();
  return base44.entities.ComplianceManagedRegister.create(data);
}

export function updateRegister(id, form) {
  return base44.entities.ComplianceManagedRegister.update(id, normalise(form));
}

/** Status-only change. Review fields are preserved when archiving. */
export function setRegisterStatus(id, status) {
  return base44.entities.ComplianceManagedRegister.update(id, { status });
}

/**
 * Deletes registers through a verified server-side cascade: each register is removed only
 * after every record it owns is gone; a failed register stays for a safe retry.
 * Resolves to { ok, deleted, failed: [{ id, title, stage, error }], missing }.
 */
export async function deleteRegisters(ids) {
  const { data } = await base44.functions.invoke('deleteRegisters', { register_ids: ids });
  return data;
}

/**
 * Deletes individual register records (entity: 'AssetRegisterItem' | 'ResponsiblePerson')
 * through the same verified server-side cascade: each record is removed only after the
 * maintenance entries, notes, documents and folders it owns are gone.
 * Resolves to { ok, deleted, failed: [{ id, title, stage, error }], missing }.
 */
export async function deleteRegisterRecords(entity, ids) {
  const { data } = await base44.functions.invoke('deleteRegisterRecords', { entity, record_ids: ids });
  return data;
}

// ── Derived helpers ───────────────────────────────────────────────────────

export function daysRemaining(nextReviewDate) {
  if (!nextReviewDate) return null;
  try {
    const target = typeof nextReviewDate === 'string' ? parseISO(nextReviewDate) : nextReviewDate;
    // Organisation's calendar day, so this agrees with the "N days overdue" label.
    return differenceInCalendarDays(target, parseISO(localToday()));
  } catch {
    return null;
  }
}

/** Registers become overdue once their next review date passes. */
export function isOverdue(register) {
  if (register.status === 'archived') return false;
  const days = daysRemaining(register.next_review_date);
  return days !== null && days < 0;
}

export function formatReviewDate(d) {
  if (!d) return '—';
  try {
    return format(typeof d === 'string' ? parseISO(d) : d, 'd MMM yyyy');
  } catch {
    return d;
  }
}