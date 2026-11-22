import { calcNextReviewDate, todayISO } from '@/lib/complianceRegisters';

/** Shared policy form helpers for the add/edit pane and the inline detail cards. */

export const policyToForm = (d, defaults = {}) => ({
  title: d?.title || '', description: d?.description || '', document_type: d?.document_type || defaults.type || '',
  category: d?.category || defaults.category || '', parent_id: d?.parent_id || defaults.parentId || '',
  owner: d?.owner || '', approved_by: d?.approved_by || '', approved_date: d?.approved_date || '', effective_date: d?.effective_date || '',
  classification: d?.classification || '', stage: d?.stage || 'Draft', status: d?.status || 'active',
  review_with_parent: d ? !!d.review_with_parent : !!defaults.parentId,
  review_frequency: d?.review_frequency || '', interval_value: d?.interval_value || 1, interval_unit: d?.interval_unit || 'Months',
  last_review_date: d ? d.last_review_date || '' : todayISO(), next_review_date: d?.next_review_date || '',
  custom_fields: d?.custom_fields || {},
});

const recalc = (n) => (n.review_frequency && n.review_frequency !== 'Ad Hoc'
  ? { ...n, next_review_date: calcNextReviewDate(n.review_frequency, { baseDate: n.last_review_date || new Date(), intervalValue: n.interval_value, intervalUnit: n.interval_unit }) || '' } : n);

/** Review-field handlers that keep the next review date in sync. `update` receives a form updater. */
export const reviewHandlers = (update) => ({
  onFrequency: (v) => update((f) => (v === 'Ad Hoc' ? { ...f, review_frequency: v, last_review_date: '', next_review_date: '' }
    : recalc({ ...f, review_frequency: v, last_review_date: f.last_review_date || todayISO() }))),
  onIntervalValue: (v) => update((f) => recalc({ ...f, interval_value: v })),
  onIntervalUnit: (v) => update((f) => recalc({ ...f, interval_unit: v })),
  onLastReviewChange: (v) => update((f) => recalc({ ...f, last_review_date: v })),
});

/** Field-keyed validation messages; empty when the form is valid. */
export const policyFormErrors = (form, parent) => Object.fromEntries(Object.entries({
  title: !form.title.trim() && 'Title is required.',
  document_type: !form.document_type && 'Document type is required.',
  category: !parent && !form.category && 'Category is required.',
  owner: !form.owner.trim() && 'Document owner is required.',
  review_frequency: !(parent && form.review_with_parent) && !form.review_frequency && 'Review frequency is required.',
}).filter(([, v]) => v));


/** True when saving would archive a policy that still has active linked documents. */
export const archivesLinked = (doc, form, children) =>
  !!doc && doc.status !== 'archived' && form.status === 'archived' && children.some((c) => c.status !== 'archived');

/** Policies a document may be linked under (none when it has its own linked documents). */
export const eligibleParents = (docs, doc, children, parentType) =>
  (children.length ? [] : docs.filter((d) => d.document_type === parentType && !d.parent_id && d.id !== doc?.id));