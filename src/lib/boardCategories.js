import { base44 } from '@/api/base44Client';
import { settleAllDeletes } from '@/lib/cascadeDelete';

export const QUERY_KEYS = ['boardCategories', 'boardCategoryOptions', 'memberAttributes', 'boardSkills', 'memberSkills'];

export function invalidateBoardComposition(qc) {
  QUERY_KEYS.forEach((key) => qc.invalidateQueries({ queryKey: [key] }));
}

const DEFAULT_CATEGORIES = [
  { name: 'Skills', kind: 'skills', cardinality: 'multi', is_locked: true, options: [] },
  { name: 'Gender', kind: 'attribute', cardinality: 'single', options: ['Male', 'Female', 'Non-Binary'] },
  { name: 'Location', kind: 'attribute', cardinality: 'single', options: ['Metro', 'Regional', 'Rural'] },
  { name: 'Descriptors', kind: 'attribute', cardinality: 'multi', options: ['Professional', 'First Nations', 'Migrant', 'Refugee', 'Youth', 'LGBTQA+', 'Disability', 'Community Leader'] },
];

/**
 * Reject a name that already exists among its siblings (case-insensitive).
 * Renames pass their own id as excludeId so re-saving an unchanged name is fine.
 */
function assertUniqueName(rows, name, label, excludeId = null) {
  const wanted = String(name || '').trim().toLowerCase();
  const clash = rows.some((r) => r.id !== excludeId && String(r.name || '').trim().toLowerCase() === wanted);
  if (clash) throw new Error(`A ${label} named "${String(name).trim()}" already exists.`);
}

// ---- BoardCategory ----
export const listCategories = () => base44.entities.BoardCategory.list('order_index');

export async function createCategory(data) {
  const existing = await base44.entities.BoardCategory.list();
  assertUniqueName(existing, data.name, 'category');
  return base44.entities.BoardCategory.create(data);
}

export async function renameCategory(id, name) {
  const existing = await base44.entities.BoardCategory.list();
  assertUniqueName(existing, name, 'category', id);
  await base44.entities.BoardCategory.update(id, { name });
  await base44.entities.MemberAttribute.updateMany({ category_id: id }, { $set: { category_name: name } });
}

/**
 * Change a category's cardinality. Flipping multi -> single would otherwise leave
 * members holding several options in a single-select category, so the surplus is
 * trimmed immediately: each person keeps their first assignment, the rest go.
 */
export async function updateCategoryCardinality(id, cardinality) {
  const updated = await base44.entities.BoardCategory.update(id, { cardinality });
  if (cardinality !== 'single') return updated;

  const rows = await base44.entities.MemberAttribute.filter({ category_id: id });
  const seen = new Set();
  const surplus = [];
  rows.forEach((r) => {
    if (seen.has(r.person_id)) surplus.push(r);
    else seen.add(r.person_id);
  });
  if (surplus.length) {
    await settleAllDeletes(surplus.map((r) => base44.entities.MemberAttribute.delete(r.id)), 'assignments');
  }
  return updated;
}

export async function deleteCategory(category) {
  if (category.is_locked) throw new Error('Locked categories cannot be deleted');
  await base44.entities.MemberAttribute.deleteMany({ category_id: category.id });
  await base44.entities.BoardCategoryOption.deleteMany({ category_id: category.id });
  return base44.entities.BoardCategory.delete(category.id);
}

// ---- BoardCategoryOption ----
export const listOptions = () => base44.entities.BoardCategoryOption.list('order_index');

export async function createOption(data) {
  const siblings = await base44.entities.BoardCategoryOption.filter({ category_id: data.category_id });
  assertUniqueName(siblings, data.name, 'option in this category');
  return base44.entities.BoardCategoryOption.create(data);
}

export async function renameOption(id, name) {
  const current = await base44.entities.BoardCategoryOption.get(id);
  const siblings = await base44.entities.BoardCategoryOption.filter({ category_id: current.category_id });
  assertUniqueName(siblings, name, 'option in this category', id);
  await base44.entities.BoardCategoryOption.update(id, { name });
  await base44.entities.MemberAttribute.updateMany({ option_id: id }, { $set: { option_name: name } });
}

export async function reorderOptions(orderedIds) {
  await base44.entities.BoardCategoryOption.bulkUpdate(orderedIds.map((id, i) => ({ id, order_index: i })));
}

export async function deleteOption(id) {
  await base44.entities.MemberAttribute.deleteMany({ option_id: id });
  return base44.entities.BoardCategoryOption.delete(id);
}

// Seed the Skills system category plus the default attribute categories once.
// Guarded against the concurrent first-load race: simultaneous callers share one
// in-flight promise, so the defaults can't be created twice. Cleared afterwards
// so a retry after a genuine failure still runs.
let categoriesSeedInFlight = null;

export async function ensureDefaultCategories() {
  if (categoriesSeedInFlight) return categoriesSeedInFlight;
  categoriesSeedInFlight = (async () => {
    const existing = await base44.entities.BoardCategory.list();
    if (existing.length > 0) return existing;
    const created = await base44.entities.BoardCategory.bulkCreate(
      DEFAULT_CATEGORIES.map(({ options, ...c }, i) => ({ ...c, is_locked: !!c.is_locked, order_index: i }))
    );
    const optionRows = [];
    created.forEach((cat) => {
      const def = DEFAULT_CATEGORIES.find((d) => d.name === cat.name);
      (def?.options || []).forEach((name, i) => optionRows.push({ category_id: cat.id, name, order_index: i }));
    });
    if (optionRows.length) await base44.entities.BoardCategoryOption.bulkCreate(optionRows);
    return created;
  })().finally(() => { categoriesSeedInFlight = null; });
  return categoriesSeedInFlight;
}

// ---- MemberAttribute ----
export const listMemberAttributes = () => base44.entities.MemberAttribute.list();

/**
 * Persist a person's attribute assignments as a DIFF against what is stored.
 *
 * Never delete-all-then-recreate — a failed recreate would wipe every attribute
 * the person had. Unchanged rows are left completely untouched; only newly
 * selected options are created and only de-selected options are deleted.
 * Single-select categories are still trimmed to their first selection.
 *
 * selections: [{ category_id, category_name, option_id, option_name }]
 */
export async function setMemberAttributes(personId, selections, categories) {
  const byCategory = new Map();
  (selections || []).forEach((s) => {
    const cat = categories.find((c) => c.id === s.category_id);
    const list = byCategory.get(s.category_id) || [];
    if (cat?.cardinality === 'single' && list.length >= 1) return;
    list.push(s);
    byCategory.set(s.category_id, list);
  });
  const desired = new Map();
  [...byCategory.values()].flat().forEach((s) => desired.set(`${s.category_id}|${s.option_id}`, s));

  const existing = await base44.entities.MemberAttribute.filter({ person_id: personId });
  const existingByKey = new Map(existing.map((r) => [`${r.category_id}|${r.option_id}`, r]));

  const toCreate = [];
  const updates = [];
  desired.forEach((s, key) => {
    const row = existingByKey.get(key);
    if (!row) toCreate.push({ ...s, person_id: personId });
    else if (row.category_name !== s.category_name || row.option_name !== s.option_name) {
      updates.push(base44.entities.MemberAttribute.update(row.id, { category_name: s.category_name, option_name: s.option_name }));
    }
  });
  const removals = existing
    .filter((r) => !desired.has(`${r.category_id}|${r.option_id}`))
    .map((r) => base44.entities.MemberAttribute.delete(r.id));

  // Additions first, so a failure leaves the person's existing assignments intact.
  if (toCreate.length) await base44.entities.MemberAttribute.bulkCreate(toCreate);
  if (updates.length) await settleAllDeletes(updates, 'assignments');
  if (removals.length) await settleAllDeletes(removals, 'assignments');
}