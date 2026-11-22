/** Backward-compatible read/write helpers for multi-owner strategy blocks. */

/** Returns the owners of a block as an array, migrating the legacy single `owner` string. */
export function parseOwners(block) {
  if (!block) return [];
  if (Array.isArray(block.owners) && block.owners.length > 0) {
    return block.owners.map((o) => (o || '').trim()).filter(Boolean);
  }
  const single = (block.owner || '').trim();
  return single ? [single] : [];
}

/** Returns the payload to persist owners, keeping the legacy `owner` field in sync. */
export function serializeOwners(arr) {
  const owners = (arr || []).map((o) => (o || '').trim()).filter(Boolean);
  return { owners, owner: owners[0] || '' };
}