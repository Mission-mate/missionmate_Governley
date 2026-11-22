import { base44 } from '@/api/base44Client';
import { normaliseAsset } from '@/lib/assetRegister';
import { deleteRegisterRecords } from '@/lib/complianceRegisters';

const Assets = () => base44.entities.AssetRegisterItem;
const Maintenance = () => base44.entities.AssetMaintenanceEntry;

export const listAssets = (registerId) => Assets().filter({ register_id: registerId }, '-created_date', 1000);
export const getAsset = (id) => Assets().get(id);

export const createAsset = (registerId, form) =>
  Assets().create({ register_id: registerId, ...normaliseAsset(form) });

export const updateAsset = (id, form) => Assets().update(id, normaliseAsset(form));

/** Sets only the status field on each asset (leaves every other field untouched). */
export const setAssetsStatus = (ids, status) => Promise.all(ids.map((id) => Assets().update(id, { status })));

/** Deletes assets with their maintenance entries, notes, documents and folders (verified server-side cascade). */
export const deleteAssets = (ids) => deleteRegisterRecords('AssetRegisterItem', ids);

export async function isAssetIdTaken(registerId, assetId, excludeId) {
  const id = (assetId || '').trim();
  if (!id) return false;
  const rows = await Assets().filter({ register_id: registerId, asset_id: id });
  return rows.some((r) => r.id !== excludeId);
}

/** Saves the register's Asset Type / Location lists and cascades renamed options onto its assets. */
export async function saveAssetOptions(register, options, renames, entity = Assets()) {
  await base44.entities.ComplianceManagedRegister.update(register.id, {
    config: { ...(register.config || {}), ...options },
  });
  for (const r of renames) {
    await entity.updateMany({ register_id: register.id, [r.field]: r.from }, { $set: { [r.field]: r.to } });
  }
}

/**
 * Scrubs orphaned custom_fields values from every asset in the register — deleted
 * columns and Single Select values no longer in their option list. Runs before
 * the new column config is saved.
 */
export async function cleanupAssetCustomFields(registerId, prevCols, nextCols, entity = Assets()) {
  const nextIds = new Set(nextCols.map((c) => c.id));
  const removedIds = prevCols.filter((c) => !nextIds.has(c.id)).map((c) => c.id);
  const scrub = nextCols
    .filter((c) => c.type === 'Single Select')
    .map((c) => ({ id: c.id, allowed: (c.config?.options || []).map((o) => o.name) }));
  if (!removedIds.length && !scrub.length) return;

  const assets = await entity.filter({ register_id: registerId }, '-created_date', 5000);
  const updates = [];
  assets.forEach((a) => {
    const map = a.custom_fields;
    if (!map || typeof map !== 'object') return;
    const next = { ...map };
    let changed = false;
    removedIds.forEach((id) => { if (id in next) { delete next[id]; changed = true; } });
    scrub.forEach(({ id, allowed }) => {
      const v = next[id];
      if (v !== undefined && v !== null && v !== '' && !allowed.includes(String(v))) { delete next[id]; changed = true; }
    });
    if (changed) updates.push({ id: a.id, custom_fields: next });
  });
  for (let i = 0; i < updates.length; i += 500) {
    await entity.bulkUpdate(updates.slice(i, i + 500));
  }
}

function cleanEntry(f) {
  return {
    date: f.date,
    type: f.type || '',
    title: (f.title || '').trim(),
    description: (f.description || '').trim(),
    provider: (f.provider || '').trim(),
    cost: f.cost === '' || f.cost == null || isNaN(Number(f.cost)) ? null : Number(f.cost),
  };
}

export const createMaintenance = (asset, form) =>
  Maintenance().create({ asset_id: asset.id, register_id: asset.register_id, ...cleanEntry(form) });
export const updateMaintenance = (id, form) => Maintenance().update(id, cleanEntry(form));
export const deleteMaintenanceMany = (ids) => Maintenance().deleteMany({ id: { $in: ids } });