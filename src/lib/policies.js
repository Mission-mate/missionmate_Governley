import { base44 } from '@/api/base44Client';
import { createCategoryStore } from '@/lib/categoryStore';
import { DEFAULT_CATEGORIES } from '@/lib/complianceRegisters';
import { toCustomColumns } from '@/lib/configNormalize';

/** Compliance Management → Policy hub: documents, categories and document types. */

const Policy = () => base44.entities.PolicyDocument;

export const policyCategoryStore = createCategoryStore({
  key: 'policy_categories', entity: 'PolicyDocument', defaults: DEFAULT_CATEGORIES,
});

export const SEEDED_DOC_TYPES = ['Policy', 'Guideline', 'Procedure', 'Standard', 'Code of Conduct', 'Fact Sheet'];
export const PARENT_TYPE = 'Policy';
export const CLASSIFICATIONS = ['Public', 'Internal', 'Restricted'];
export const STAGES = ['Draft', 'Under Review', 'Approved', 'Withdrawn', 'Superseded'];
export const POLICY_STATUSES = [{ value: 'active', label: 'Active' }, { value: 'archived', label: 'Archived' }];

const REVIEW_KEYS = ['review_frequency', 'interval_value', 'interval_unit', 'last_review_date', 'next_review_date'];

// ── Document types ────────────────────────────────────────────────────────
const DOC_TYPES_KEY = 'policy_document_types';

async function docTypesRecord() {
  const rows = await base44.entities.AppConfig.filter({ key: DOC_TYPES_KEY });
  if (rows.length) return rows[0];
  return base44.entities.AppConfig.create({ key: DOC_TYPES_KEY, settings: { types: [...SEEDED_DOC_TYPES] } });
}

/** Document types (seeded first, always present) and custom columns. */
export async function getPolicyConfig() {
  const s = (await docTypesRecord()).settings || {};
  const extra = (s.types || []).filter((t) => !SEEDED_DOC_TYPES.includes(t));
  return { types: [...SEEDED_DOC_TYPES, ...extra], columns: toCustomColumns(s.custom_columns) };
}

/** Saves types/columns; `renames` [{from,to}] update existing documents. */
export async function savePolicyConfig({ types, columns }, renames = []) {
  const r = await docTypesRecord();
  for (const { from, to } of renames) await Policy().updateMany({ document_type: from }, { $set: { document_type: to } });
  await base44.entities.AppConfig.update(r.id, { settings: { ...(r.settings || {}), types, custom_columns: columns } });
}

// ── Documents ─────────────────────────────────────────────────────────────
export const listPolicies = () => Policy().list('-created_date', 1000);
export const getPolicy = (id) => Policy().get(id);

const reviewOf = (doc) => Object.fromEntries(REVIEW_KEYS.map((k) => [k, doc?.[k] ?? null]));

function normalise(form, parent) {
  const isEvery = form.review_frequency === 'Every';
  const data = {
    title: (form.title || '').trim(),
    description: form.description || '',
    document_type: form.document_type,
    category: parent ? parent.category : form.category,
    parent_id: parent ? parent.id : null,
    owner: (form.owner || '').trim(),
    approved_by: (form.approved_by || '').trim(),
    approved_date: form.approved_date || null,
    effective_date: form.effective_date || null,
    classification: form.classification || null,
    stage: form.stage || 'Draft',
    status: form.status || 'active',
    review_with_parent: !!parent && !!form.review_with_parent,
    review_frequency: form.review_frequency || null,
    interval_value: isEvery ? Number(form.interval_value) || null : null,
    interval_unit: isEvery ? form.interval_unit || 'Months' : null,
    last_review_date: form.last_review_date || null,
    next_review_date: form.next_review_date || null,
    custom_fields: form.custom_fields || {},
  };
  return data.review_with_parent ? { ...data, ...reviewOf(parent) } : data;
}

/** Pushes a parent's category (all children) and review schedule (sharing children) down. */
async function syncChildren(parent) {
  await Policy().updateMany({ parent_id: parent.id }, { $set: { category: parent.category } });
  await Policy().updateMany({ parent_id: parent.id, review_with_parent: true }, { $set: reviewOf(parent) });
}

/**
 * `file` (new documents only) is the primary policy file, uploaded before the record is created.
 * Its first version is created by the policyVersions function when the document is opened.
 */
export async function savePolicy(id, form, parent, file = null, displayTitle = '') {
  let data = normalise(form, parent);
  if (file) {
    const { file_uri } = await base44.integrations.Core.UploadPrivateFile({ file });
    data = { ...data, primary_file_uri: file_uri, primary_file_name: file.name, primary_display_title: displayTitle.trim() };
  }
  const saved = id ? await Policy().update(id, data) : await Policy().create(data);
  if (id) await syncChildren({ ...data, id });
  return saved;
}

export async function linkExisting(childId, parent, shareReview) {
  await Policy().update(childId, {
    parent_id: parent.id, category: parent.category, review_with_parent: shareReview,
    ...(shareReview ? reviewOf(parent) : {}),
  });
}

export const unlinkPolicy = (childId) => Policy().update(childId, { parent_id: null, review_with_parent: false });

export async function setPolicyStatus(id, status, includeChildren = false) {
  await Policy().update(id, { status });
  if (includeChildren) await Policy().updateMany({ parent_id: id }, { $set: { status } });
}

/** Deletes a document; its linked documents are deleted too, or kept as standalone documents. */
export async function deletePolicy(id, deleteChildren = false) {
  if (deleteChildren) {
    const childIds = (await Policy().filter({ parent_id: id })).map((c) => c.id);
    if (childIds.length) await base44.entities.PolicyVersion.deleteMany({ policy_id: { $in: childIds } });
    await Policy().deleteMany({ parent_id: id });
  } else await Policy().updateMany({ parent_id: id }, { $set: { parent_id: null, review_with_parent: false } });
  await base44.entities.PolicyVersion.deleteMany({ policy_id: id });
  await Policy().delete(id);
}

export const childrenOf = (docs, id) => docs.filter((d) => d.parent_id === id);

// ── Tree ──────────────────────────────────────────────────────────────────
/**
 * Builds category → [{ doc, muted, children }] for the current view. A parent
 * that doesn't match the filter stays (muted) when one of its children does.
 */
export const POLICY_STAGES = STAGES;

export function buildTree(docs, { search = '', filters = {} }) {
  const q = search.trim().toLowerCase();
  const matches = (d) => Object.entries(filters).every(([k, v]) => d[k] === v) && (!q || (d.title || '').toLowerCase().includes(q));
  const ids = new Set(docs.map((d) => d.id));
  const roots = docs.filter((d) => !d.parent_id || !ids.has(d.parent_id));
  const byCategory = {};
  roots.forEach((doc) => {
    const children = docs.filter((c) => c.parent_id === doc.id && matches(c));
    if (!matches(doc) && !children.length) return;
    (byCategory[doc.category] ||= []).push({ doc, muted: !matches(doc), children });
  });
  return byCategory;
}