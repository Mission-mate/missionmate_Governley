// Per-tab customisation for the WHS register: editable system option lists + custom columns.
import { base44 } from '@/api/base44Client';
import { getAssetCustomColumns } from '@/lib/assetRegister';
import { cleanupAssetCustomFields } from '@/lib/assetRegisterApi';
import { whsConfig } from '@/lib/whsRegister';

export const WHS_CUSTOMISE = {
  hazards: { entity: 'WhsHazard', noun: 'hazard', columnsKey: 'hazard_custom_columns',
    system: [{ key: 'hazard_categories', field: 'category', label: 'Category' }] },
  incidents: { entity: 'WhsIncident', noun: 'incident', columnsKey: 'incident_custom_columns',
    system: [{ key: 'incident_types', field: 'incident_type', label: 'Incident Type' }, { key: 'treatments', field: 'treatment', label: 'Treatment' }] },
  checks: { entity: 'WhsSafetyCheck', noun: 'safety check', columnsKey: 'check_custom_columns', system: [] },
};

/** Custom columns configured for a tab. */
export const whsCustomColumns = (register, tabKey) => getAssetCustomColumns(register, WHS_CUSTOMISE[tabKey].columnsKey);

/** "Additional Fields" section appended to a record's sections when custom columns exist. */
export const customSection = (columns = []) => (columns.length
  ? [{ title: 'Additional Fields', fields: [{ key: 'custom_fields', label: 'Additional Fields', type: 'custom', columns, wide: true }] }]
  : []);

let seq = 0;
export const toDraftOptions = (names) => names.map((name) => ({ id: `o${Date.now()}${seq++}`, name }));

export function initialDraft(register, tabKey) {
  const cfg = whsConfig(register);
  const def = WHS_CUSTOMISE[tabKey];
  const draft = { custom: whsCustomColumns(register, tabKey) };
  def.system.forEach(({ key }) => { draft[key] = toDraftOptions(cfg[key] || []); });
  return draft;
}

/** Diff the draft against the stored lists: renames (by option id) and removed names per field. */
export const diffOptions = (baseline, draft, tabKey) => diffSystemOptions(WHS_CUSTOMISE[tabKey].system, baseline, draft);

/** Customiser adapter for one WHS tab (used by the shared customise pane). */
export const whsAdapter = (tabKey) => ({
  def: WHS_CUSTOMISE[tabKey],
  initialDraft: (register) => initialDraft(register, tabKey),
  diff: (baseline, draft) => diffOptions(baseline, draft, tabKey),
  countInUse: (register, diffs) => countInUse(register.id, tabKey, diffs),
  save: (register, diffs, custom) => saveWhsCustomisation(register, tabKey, diffs, custom),
});

export function diffSystemOptions(system, baseline, draft) {
  return system.map(({ key, field, label }) => {
    const next = (draft[key] || []).map((o) => ({ ...o, name: String(o.name ?? '').trim() })).filter((o) => o.name);
    const renames = [];
    const removed = [];
    (baseline[key] || []).forEach((p) => {
      const n = next.find((o) => o.id === p.id);
      if (!n) removed.push(p.name);
      else if (n.name !== p.name) renames.push({ from: p.name, to: n.name });
    });
    return { key, field, label, names: [...new Set(next.map((o) => o.name))], renames, removed };
  });
}

/** Records using any removed option, per field. */
export async function countInUse(registerId, tabKey, diffs) {
  const entity = base44.entities[WHS_CUSTOMISE[tabKey].entity];
  const counts = await Promise.all(diffs.map((d) => (d.removed.length
    ? entity.count({ register_id: registerId, [d.field]: { $in: d.removed } }) : 0)));
  return diffs.map((d, i) => ({ label: d.label, count: counts[i] })).filter((c) => c.count > 0);
}

async function updateAll(entity, query, set) {
  let res;
  do { res = await entity.updateMany(query, { $set: set }); } while (res?.has_more);
}

/** Clears removed options, cascades renames, scrubs custom values, then saves the config. */
export async function saveWhsCustomisation(register, tabKey, diffs, custom) {
  const def = WHS_CUSTOMISE[tabKey];
  const entity = base44.entities[def.entity];
  for (const d of diffs) {
    if (d.removed.length) await updateAll(entity, { register_id: register.id, [d.field]: { $in: d.removed } }, { [d.field]: null });
    for (const r of d.renames) await updateAll(entity, { register_id: register.id, [d.field]: r.from }, { [d.field]: r.to });
  }
  await cleanupAssetCustomFields(register.id, whsCustomColumns(register, tabKey), custom, entity);
  const lists = Object.fromEntries(diffs.map((d) => [d.key, d.names]));
  await base44.entities.ComplianceManagedRegister.update(register.id, {
    config: { ...(register.config || {}), ...lists, [def.columnsKey]: custom },
  });
}