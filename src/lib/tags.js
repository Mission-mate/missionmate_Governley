import { DEFAULT_TAG_COLOR } from '@/lib/tagColors';

/**
 * Tag reference resolution.
 *
 * Contact.tags and Member.tags store Tag **IDs**. Display name and colour are
 * always resolved live from the Tag registry, so renaming or recolouring a tag
 * in Settings is reflected everywhere immediately and deleting one can never
 * leave an orphaned name string behind.
 */

/** Build an id -> { id, name, color } lookup from a Tag registry list. */
export function buildTagMap(tags = []) {
  const map = {};
  tags.forEach((t) => {
    map[t.id] = { id: t.id, name: t.name, color: t.color || DEFAULT_TAG_COLOR };
  });
  return map;
}

/**
 * Resolve an array of stored Tag IDs into displayable tags.
 * IDs with no matching registry entry are dropped — a deleted tag simply
 * disappears rather than rendering as an uncoloured mystery pill.
 */
export function resolveTags(ids = [], tagMap = {}) {
  return (ids || []).map((id) => tagMap[id]).filter(Boolean);
}

/** Comma-separated tag names for a set of stored IDs (used by exports). */
export function tagNames(ids = [], tagMap = {}) {
  return resolveTags(ids, tagMap).map((t) => t.name);
}