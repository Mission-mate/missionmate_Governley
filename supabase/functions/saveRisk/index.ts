import { createClientFromRequest, serve } from '../_shared/base44.ts';
import { loadRiskIds, isTaken, holdsId, duplicateResponse } from '../_shared/riskIds.ts';

// Fields a caller may set directly. Arrays are only changed through arrayOps,
// and rating_history / version are owned by this function.
const SCALAR_FIELDS = [
  'risk_id', 'date_raised', 'raised_by', 'title', 'description', 'category', 'risk_appetite', 'owner',
  'cause', 'impact', 'inherent_likelihood', 'inherent_consequence', 'inherent_rating',
  'residual_likelihood', 'residual_consequence', 'residual_rating', 'treatment_action',
  'monitoring_method', 'progress_notes', 'review_frequency', 'last_reviewed_date', 'next_review_date',
  'status', 'custom_fields', 'order_index',
];
const ARRAY_FIELDS = ['treatment_plan', 'existing_controls', 'review_log'];
/** The only supported treatment action statuses (mirrors STATUS_OPTIONS in the app). */
const ACTION_STATUSES = ['Not Started', 'In Progress', 'On Hold', 'Completed'];
const TRACKED = [
  ['Status', 'status', 'Active'],
  ['Inherent Rating', 'inherent_rating', '—'],
  ['Residual Rating', 'residual_rating', '—'],
];
const MAX_ATTEMPTS = 5;

// Empty values (undefined, null, '') and key order never count as a difference.
const norm = (v) => {
  if (v === undefined || v === null || v === '') return null;
  if (Array.isArray(v)) return v.map(norm);
  if (typeof v === 'object') {
    const out = {};
    Object.keys(v).sort().forEach((k) => {
      const n = norm(v[k]);
      if (n !== null) out[k] = n;
    });
    return out;
  }
  return v;
};
const same = (a, b) => JSON.stringify(norm(a)) === JSON.stringify(norm(b));

/**
 * The single write path for Risk records.
 *
 * Body: { id, fields?, base?, arrayOps? }
 *  - fields: scalar values to set. A field listed in `base` is rejected as a
 *    conflict when the stored value no longer matches what the editor started from.
 *  - arrayOps: [{ field, upserts: [{ item, base }], removes: [id], patches: [{ id, patch }] }]
 *    applied item-by-item to the stored array, so other items are never replaced.
 *
 * Each write is a compare-and-swap on the record version, so a stale write can
 * never land. Conflicts return 409 { conflict, conflicts, record }.
 */
export default async function handler(req: Request): Promise<Response> {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me().catch((e) => (e.status === 401 ? null : Promise.reject(e)));
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });
    // Clients cannot write Risk records directly; this function is the write boundary.
    const sr = base44.asServiceRole;

    const body = await req.json().catch(() => ({}));
    const id = body?.id;
    const fields = body?.fields && typeof body.fields === 'object' ? body.fields : {};
    const base = body?.base && typeof body.base === 'object' ? body.base : {};
    const arrayOps = Array.isArray(body?.arrayOps) ? body.arrayOps : [];
    const keys = SCALAR_FIELDS.filter((k) => k in fields);

    if (!id || typeof id !== 'string') return Response.json({ error: 'id is required' }, { status: 400 });
    if (keys.length === 0 && arrayOps.length === 0) return Response.json({ error: 'Nothing to save' }, { status: 400 });
    const badOp = arrayOps.some((op) => !ARRAY_FIELDS.includes(op?.field) || (op.upserts || []).some((u) => !u?.item?.id));
    if (badOp) return Response.json({ error: 'Invalid array operation' }, { status: 400 });
    const badStatus = arrayOps.some((op) => op.field === 'treatment_plan' && [
      ...(op.upserts || []).map((u) => u.item),
      ...(op.patches || []).map((p) => p?.patch || {}),
    ].some((a) => 'status' in a && !ACTION_STATUSES.includes(a.status)));
    if (badStatus) return Response.json({ error: `Treatment action status must be one of: ${ACTION_STATUSES.join(', ')}` }, { status: 400 });
    if ('risk_id' in fields) {
      fields.risk_id = String(fields.risk_id ?? '').trim();
      if (!fields.risk_id) return Response.json({ error: 'Risk ID is required', field: 'risk_id' }, { status: 400 });
    }

    for (let attempt = 0; attempt < MAX_ATTEMPTS; attempt++) {
      const current = await sr.entities.Risk.get(id).catch((e) => (e.status === 404 ? null : Promise.reject(e)));
      if (!current) return Response.json({ error: 'Risk not found' }, { status: 404 });

      const conflicts = [];
      const set = {};

      for (const key of keys) {
        const mine = fields[key] ?? null;
        if (same(mine, current[key])) continue;
        if (key in base && !same(base[key], current[key])) {
          conflicts.push({ field: key, current: current[key] ?? null, yours: mine });
        } else {
          set[key] = mine;
        }
      }

      for (const op of arrayOps) {
        let list = Array.isArray(current[op.field]) ? [...current[op.field]] : [];
        for (const { item, base: itemBase } of op.upserts || []) {
          const idx = list.findIndex((x) => x.id === item.id);
          const stored = idx >= 0 ? list[idx] : null;
          if (itemBase && !same(itemBase, stored) && !same(item, stored)) {
            conflicts.push({ field: op.field, itemId: item.id, current: stored, yours: item });
          } else if (idx >= 0) {
            list[idx] = item;
          } else {
            list.push(item);
          }
        }
        const removes = op.removes || [];
        if (removes.length) list = list.filter((x) => !removes.includes(x.id));
        for (const { id: itemId, patch } of op.patches || []) {
          list = list.map((x) => (x.id === itemId ? { ...x, ...patch } : x));
        }
        set[op.field] = list;
      }

      if (conflicts.length) return Response.json({ conflict: true, conflicts, record: current }, { status: 409 });

      const renaming = 'risk_id' in set;
      if (renaming && isTaken(await loadRiskIds(sr), set.risk_id, id)) return duplicateResponse(set.risk_id);

      // Audit trail — built from the stored record, so entries are never lost.
      const changes = TRACKED
        .map(([field, key, empty]) => ({ field, from: current[key] || empty, to: (key in set ? set[key] : current[key]) || empty }))
        .filter((c) => c.from !== c.to);
      if (changes.length) {
        set.rating_history = [...(current.rating_history || []), {
          id: `rh_${crypto.randomUUID()}`,
          timestamp: new Date().toISOString(),
          changed_by: user.full_name || user.email || 'Unknown',
          changes,
        }];
      }

      // Compare-and-swap: only lands if nobody else wrote since we read.
      const version = Number(current.version) || 0;
      const guard = version === 0
        ? { id, $or: [{ version: 0 }, { version: { $exists: false } }] }
        : { id, version };
      const result = await sr.entities.Risk.updateMany(guard, { $set: { ...set, version: version + 1 } });
      if (result?.updated === 1) {
        // A concurrent write may have claimed the same ID; the record that held it
        // first keeps it, and this rename is rolled back.
        if (renaming && !holdsId(await loadRiskIds(sr), id)) {
          await sr.entities.Risk.updateMany({ id, version: version + 1 }, { $set: { risk_id: current.risk_id ?? '', version: version + 2 } });
          return duplicateResponse(set.risk_id);
        }
        return Response.json({ record: await sr.entities.Risk.get(id) });
      }
    }

    return Response.json({ error: 'This risk is being updated by someone else. Please try again.' }, { status: 503 });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
}

serve(handler);
