/**
 * Shared helpers for the Grant lookup entities (GrantProvider / GrantActivity).
 *
 * Every Grant stores BOTH the relationship (idField) and a cached display name
 * (nameField). The ID is authoritative; the cached name exists only so lists and
 * charts can render without a join. These helpers are the single place that
 * knows that mapping, so the rename/delete/reconcile paths can never disagree.
 */

export const LOOKUP_CONFIG = {
  GrantProvider: { idField: 'provider_id', nameField: 'provider', label: 'provider' },
  GrantActivity: { idField: 'activity_id', nameField: 'program', label: 'activity' },
};

export const LOOKUP_ENTITIES = Object.keys(LOOKUP_CONFIG);

/** Case-insensitive, whitespace-trimmed comparison key for a lookup name. */
export function nameKey(name) {
  return String(name || '').trim().toLowerCase();
}

/**
 * Finds an existing record whose name collides with `name`, ignoring `excludeId`
 * (the record being renamed). Returns the colliding record or null.
 */
export function findNameCollision(records, name, excludeId) {
  const key = nameKey(name);
  if (!key) return null;
  return records.find((r) => r.id !== excludeId && nameKey(r.name) === key) || null;
}

/** Loads every record of an entity, paging so large sets are never truncated. */
export async function listAll(client, entityName, pageSize = 500) {
  const out = [];
  let skip = 0;
  while (true) {
    const batch = await client.entities[entityName].list('-created_date', pageSize, skip);
    if (!batch || batch.length === 0) break;
    out.push(...batch);
    if (batch.length < pageSize) break;
    skip += pageSize;
  }
  return out;
}

/**
 * Reconciles every grant's cached lookup names against the canonical records.
 *
 * Two repairs, both driven by the ID being authoritative:
 *  a) grant HAS an id link → cached name is forced to match the lookup's name.
 *  b) grant has NO id link but a non-empty cached name → matched by name to an
 *     existing lookup and the id is back-filled (legacy pre-ID grants).
 *
 * Returns per-entity counts plus the combined grant updates applied.
 */
export async function reconcileGrantLookups(client) {
  const grants = await listAll(client, 'Grant');
  const patches = new Map(); // grantId -> partial update
  const summary = {};

  const addPatch = (grantId, field, value) => {
    const existing = patches.get(grantId) || {};
    existing[field] = value;
    patches.set(grantId, existing);
  };

  for (const entityName of LOOKUP_ENTITIES) {
    const { idField, nameField } = LOOKUP_CONFIG[entityName];
    const records = await listAll(client, entityName);
    const byId = new Map(records.map((r) => [r.id, r]));
    const byName = new Map();
    // First record wins for a given name key, so duplicates resolve deterministically.
    records.forEach((r) => {
      const key = nameKey(r.name);
      if (key && !byName.has(key)) byName.set(key, r);
    });

    let namesRepaired = 0;
    let idsBackfilled = 0;
    let orphaned = 0;

    for (const g of grants) {
      const linkedId = g[idField];
      const cachedName = g[nameField];

      if (linkedId) {
        const rec = byId.get(linkedId);
        if (!rec) {
          // The lookup no longer exists — leave the grant untouched and report it
          // rather than silently clearing data the user may still need.
          orphaned += 1;
          continue;
        }
        if ((cachedName || '') !== (rec.name || '')) {
          addPatch(g.id, nameField, rec.name || '');
          namesRepaired += 1;
        }
      } else if (nameKey(cachedName)) {
        const rec = byName.get(nameKey(cachedName));
        if (rec) {
          addPatch(g.id, idField, rec.id);
          if ((cachedName || '') !== (rec.name || '')) addPatch(g.id, nameField, rec.name || '');
          idsBackfilled += 1;
        }
      }
    }

    summary[entityName] = { namesRepaired, idsBackfilled, orphaned };
  }

  const updates = Array.from(patches.entries()).map(([id, patch]) => ({ id, ...patch }));
  if (updates.length) {
    // bulkUpdate caps at 500 records per call.
    for (let i = 0; i < updates.length; i += 500) {
      await client.entities.Grant.bulkUpdate(updates.slice(i, i + 500));
    }
  }

  return { grantsScanned: grants.length, grantsUpdated: updates.length, summary };
}