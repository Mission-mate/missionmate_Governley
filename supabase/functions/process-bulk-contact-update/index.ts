import { createClientFromRequest, serve } from '../_shared/base44.ts';

/**
 * Centralized bulk processing for Contacts.
 * Single source of truth for bulk update / delete / upload operations.
 *
 * Payload:
 *   {
 *     operation: 'update' | 'delete' | 'upload',
 *     ids?: string[],                 // for update / delete
 *     changes?: object,               // for update — partial Contact fields
 *     tagOps?: { add?: string[], remove?: string[] }, // for update — tag set ops
 *     contactTypeOps?: { add?: string[], remove?: string[] }, // multi-select Contact Type set ops
 *     records?: object[],             // for upload — array of new Contact objects
 *   }
 *
 * Processing is done in chunks to avoid request timeouts. Updates apply
 * tag add/remove as set operations so duplicates are never created.
 */

const CHUNK_SIZE = 15;
const CONTACT_TYPE_FIELD_ID = 'contact_type';

async function runInChunks(items, worker) {
  let processed = 0;
  let failed = 0;
  for (let i = 0; i < items.length; i += CHUNK_SIZE) {
    const slice = items.slice(i, i + CHUNK_SIZE);
    const results = await Promise.allSettled(slice.map(worker));
    results.forEach((r) => {
      if (r.status === 'fulfilled') processed += 1;
      else failed += 1;
    });
  }
  return { processed, failed };
}

function applyTagOps(existingTags, tagOps) {
  if (!tagOps) return null;
  const set = new Set(Array.isArray(existingTags) ? existingTags : []);
  (tagOps.add || []).forEach((t) => set.add(t));
  (tagOps.remove || []).forEach((t) => set.delete(t));
  return [...set];
}

// Apply Add / Remove set operations to the multi-select Contact Type custom field.
function applyContactTypeOps(existingValue, ops) {
  if (!ops) return null;
  const current = Array.isArray(existingValue)
    ? existingValue
    : (existingValue ? [existingValue] : []);
  const set = new Set(current);
  (ops.add || []).forEach((t) => set.add(t));
  (ops.remove || []).forEach((t) => set.delete(t));
  return [...set];
}

serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });

    const body = await req.json();
    const { operation, ids = [], changes = {}, tagOps = null, contactTypeOps = null, records = [] } = body || {};

    if (operation === 'update') {
      if (!ids.length) return Response.json({ error: 'No contact ids provided' }, { status: 400 });

      const hasTagOps = tagOps && (tagOps.add?.length || tagOps.remove?.length);
      const hasContactTypeOps = contactTypeOps && (contactTypeOps.add?.length || contactTypeOps.remove?.length);
      const hasCustomFields = changes.custom_fields && Object.keys(changes.custom_fields).length > 0;

      // Fetch current records when we need to merge tags, contact type, or custom_fields
      // (so we never wipe untouched tags / other custom field values).
      let currentById = {};
      if (hasTagOps || hasContactTypeOps || hasCustomFields) {
        const current = await Promise.all(ids.map((id) => base44.entities.Contact.get(id)));
        current.forEach((c) => { if (c) currentById[c.id] = c; });
      }

      const { custom_fields: customFieldChanges, ...topLevelChanges } = changes;

      const result = await runInChunks(ids, async (id) => {
        const patch = { ...topLevelChanges };
        if (hasTagOps) {
          patch.tags = applyTagOps(currentById[id]?.tags, tagOps);
        }
        if (hasCustomFields || hasContactTypeOps) {
          const mergedCustom = { ...(currentById[id]?.custom_fields || {}), ...(customFieldChanges || {}) };
          if (hasContactTypeOps) {
            mergedCustom[CONTACT_TYPE_FIELD_ID] = applyContactTypeOps(
              mergedCustom[CONTACT_TYPE_FIELD_ID],
              contactTypeOps
            );
          }
          patch.custom_fields = mergedCustom;
        }
        return base44.entities.Contact.update(id, patch);
      });

      return Response.json({ success: true, operation, ...result, total: ids.length });
    }

    if (operation === 'delete') {
      if (!ids.length) return Response.json({ error: 'No contact ids provided' }, { status: 400 });
      const result = await runInChunks(ids, (id) => base44.entities.Contact.delete(id));
      return Response.json({ success: true, operation, ...result, total: ids.length });
    }

    if (operation === 'upload') {
      if (!records.length) return Response.json({ error: 'No records provided' }, { status: 400 });
      const result = await runInChunks(records, (rec) => base44.entities.Contact.create(rec));
      return Response.json({ success: true, operation, ...result, total: records.length });
    }

    return Response.json({ error: 'Unknown operation: ' + operation }, { status: 400 });
  } catch (error) {
    // Keep the real error in server-side logs only — never in the client response.
    console.error('processBulkContactUpdate failed:', error);
    return Response.json({ error: 'Something went wrong. Please try again.' }, { status: 500 });
  }
});