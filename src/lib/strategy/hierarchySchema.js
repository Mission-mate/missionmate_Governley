import { z } from 'zod';

/**
 * Validation gate between the stored strategy_layers config and the UI.
 *
 * The database can hold layer records written by an older build (or hand-edited),
 * so nothing downstream should trust its shape. This module validates each stored
 * entry and drops anything malformed, letting getLayers() re-append the built-in
 * defaults for whatever is missing.
 */
const StoredLayerSchema = z.object({
  key: z.string().min(1),
  level: z.coerce.number().finite(),
  name: z.string().optional(),
  enabled: z.boolean().optional(),
});

/**
 * Returns the subset of stored layers that are structurally valid.
 * Returns null when there is nothing usable, so callers fall back to defaults.
 */
export function sanitizeStoredLayers(stored, { knownKeys, onWarn } = {}) {
  if (!Array.isArray(stored) || stored.length === 0) return null;

  const seen = new Set();
  const valid = [];

  stored.forEach((entry, i) => {
    const parsed = StoredLayerSchema.safeParse(entry);
    if (!parsed.success) {
      onWarn?.(`Strategy layer at index ${i} is malformed and was ignored.`);
      return;
    }
    const layer = parsed.data;
    if (seen.has(layer.key)) {
      onWarn?.(`Duplicate strategy layer "${layer.key}" was ignored.`);
      return;
    }
    if (knownKeys && !knownKeys.has(layer.key)) {
      onWarn?.(`Unknown strategy layer "${layer.key}" is no longer defined and was ignored.`);
      return;
    }
    seen.add(layer.key);
    valid.push(layer);
  });

  return valid.length ? valid : null;
}