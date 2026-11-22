/**
 * Shared Tag reference maintenance.
 *
 * Contact.tags and Member.tags hold Tag IDs, and SmartList.filters.tags holds
 * Tag IDs too. These helpers keep those references consistent when tags are
 * deleted, and convert legacy name-based references to IDs.
 */

const DEFAULT_TAG_COLOR = 'gray';

/** Entities that carry Tag ID arrays on a plain `tags` field. */
export const TAGGED_ENTITIES = ['Contact', 'Member'];

/** Remove a Tag ID from every Contact, Member and SmartList that references it. */
export async function stripTagId(db, tagId) {
  let updated = 0;

  for (const entityName of TAGGED_ENTITIES) {
    const rows = await db.entities[entityName].list();
    const affected = rows.filter((r) => Array.isArray(r.tags) && r.tags.includes(tagId));
    for (const row of affected) {
      await db.entities[entityName].update(row.id, {
        tags: row.tags.filter((t) => t !== tagId),
      });
      updated += 1;
    }
  }

  // Saved smart groups filter on tag IDs — drop the deleted tag from them too,
  // otherwise the group silently filters on something that no longer exists.
  const lists = await db.entities.SmartList.list();
  for (const list of lists) {
    const tags = list.filters?.tags;
    if (!Array.isArray(tags) || !tags.includes(tagId)) continue;
    await db.entities.SmartList.update(list.id, {
      filters: { ...list.filters, tags: tags.filter((t) => t !== tagId) },
    });
    updated += 1;
  }

  return updated;
}

/**
 * Convert legacy tag-name references into Tag IDs.
 *
 * Any entry that is already a known Tag ID is left alone. Anything else is
 * treated as a name: matched case-insensitively against the registry, and if
 * no tag exists with that name a new one is created (default colour) so no
 * record silently loses its tags.
 */
export async function migrateTagNamesToIds(db, { dryRun = false } = {}) {
  const tags = await db.entities.Tag.list();

  const knownIds = new Set(tags.map((t) => t.id));
  const idByName = new Map();
  tags.forEach((t) => {
    const key = (t.name || '').trim().toLowerCase();
    if (key && !idByName.has(key)) idByName.set(key, t.id);
  });

  const created = [];

  // Resolve one stored entry to a Tag ID, creating the tag if needed.
  const toId = async (entry) => {
    if (typeof entry !== 'string' || !entry.trim()) return null;
    if (knownIds.has(entry)) return entry;

    const key = entry.trim().toLowerCase();
    if (idByName.has(key)) return idByName.get(key);

    if (dryRun) {
      // Record the intent without touching the registry.
      if (!created.includes(entry.trim())) created.push(entry.trim());
      return `__would_create__${entry.trim()}`;
    }

    const tag = await db.entities.Tag.create({
      name: entry.trim(),
      color: DEFAULT_TAG_COLOR,
      description: '',
    });
    knownIds.add(tag.id);
    idByName.set(key, tag.id);
    created.push(tag.name);
    return tag.id;
  };

  // Map a stored tags array to IDs, de-duplicating the result.
  const mapList = async (list) => {
    const out = [];
    for (const entry of list) {
      const id = await toId(entry);
      if (id && !out.includes(id)) out.push(id);
    }
    return out;
  };

  const summary = { created, records: {}, smartLists: 0 };

  for (const entityName of TAGGED_ENTITIES) {
    const rows = await db.entities[entityName].list();
    let changed = 0;
    for (const row of rows) {
      const current = Array.isArray(row.tags) ? row.tags : [];
      if (current.length === 0) continue;
      const next = await mapList(current);
      const same = next.length === current.length && next.every((v, i) => v === current[i]);
      if (same) continue;
      if (!dryRun) await db.entities[entityName].update(row.id, { tags: next });
      changed += 1;
    }
    summary.records[entityName] = changed;
  }

  const lists = await db.entities.SmartList.list();
  for (const list of lists) {
    const current = list.filters?.tags;
    if (!Array.isArray(current) || current.length === 0) continue;
    const next = await mapList(current);
    const same = next.length === current.length && next.every((v, i) => v === current[i]);
    if (same) continue;
    if (!dryRun) {
      await db.entities.SmartList.update(list.id, {
        filters: { ...list.filters, tags: next },
      });
    }
    summary.smartLists += 1;
  }

  return summary;
}