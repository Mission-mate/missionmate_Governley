import { base44 } from '@/api/base44Client';

export const PROTECTED_CATEGORY = 'Governance';

/**
 * Category list stored in one AppConfig record. Renames and removals cascade
 * onto the `category` field of the given entity's records.
 */
export function createCategoryStore({ key, entity, defaults }) {
  const records = () => base44.entities[entity];

  async function record() {
    const rows = await base44.entities.AppConfig.filter({ key });
    if (rows.length) return rows[0];
    return base44.entities.AppConfig.create({ key, settings: { categories: [...defaults] } });
  }

  async function getCategories() {
    return (await record()).settings?.categories || [];
  }

  async function saveCategories(categories) {
    const r = await record();
    await base44.entities.AppConfig.update(r.id, { settings: { ...(r.settings || {}), categories } });
    return categories;
  }

  async function addCategory(name) {
    const categories = await getCategories();
    const trimmed = name.trim();
    if (!trimmed || categories.includes(trimmed)) return categories;
    return saveCategories([...categories, trimmed]);
  }

  async function renameCategory(oldName, newName) {
    const categories = await getCategories();
    const trimmed = newName.trim();
    if (!trimmed) return categories;
    const next = categories.map((c) => (c === oldName ? trimmed : c));
    await saveCategories(next);
    await records().updateMany({ category: oldName }, { $set: { category: trimmed } });
    return next;
  }

  /** Removes a category and moves its records to Governance. */
  async function removeCategory(name) {
    if (name === PROTECTED_CATEGORY) return getCategories();
    const next = (await getCategories()).filter((c) => c !== name);
    if (!next.includes(PROTECTED_CATEGORY)) next.unshift(PROTECTED_CATEGORY);
    await saveCategories(next);
    await records().updateMany({ category: name }, { $set: { category: PROTECTED_CATEGORY } });
    return next;
  }

  return { getCategories, saveCategories, addCategory, renameCategory, removeCategory };
}