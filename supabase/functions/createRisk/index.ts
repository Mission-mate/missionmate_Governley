import { createClientFromRequest, serve } from '../_shared/base44.ts';
import { loadRiskIds, nextAvailableId, isTaken, holdsId, duplicateResponse } from '../_shared/riskIds.ts';

// Fields a caller may set when logging a risk. risk_id is assigned here.
const FIELDS = ['date_raised', 'raised_by', 'title', 'description', 'category', 'risk_appetite', 'owner', 'status',
  'review_frequency', 'last_reviewed_date', 'next_review_date'];
const MAX_ATTEMPTS = 8;

/**
 * The single create path for Risk records (clients cannot create them directly).
 *
 * Body: { preview: true } → { risk_id } — the next available ID, for display only.
 * Body: { fields, risk_id?, auto? } → { record }
 *  - auto (or a blank risk_id): the server assigns the next available ID; if a
 *    concurrent create takes the same number, this record moves to the next one.
 *  - otherwise the requested risk_id is kept and must be unused (409 duplicate).
 *
 * Uniqueness is verified after the write, so simultaneous creates can never
 * both keep the same ID: the oldest record keeps it.
 */
export default async function handler(req: Request): Promise<Response> {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me().catch((e) => (e.status === 401 ? null : Promise.reject(e)));
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });
    const sr = base44.asServiceRole;

    const body = await req.json().catch(() => ({}));
    if (body?.preview) {
      return Response.json({ risk_id: nextAvailableId(await loadRiskIds(sr)) });
    }

    const fields = body?.fields && typeof body.fields === 'object' ? body.fields : {};
    const title = String(fields.title ?? '').trim();
    const owner = String(fields.owner ?? '').trim();
    if (!title || !owner) return Response.json({ error: 'Risk Title and Risk Owner are required' }, { status: 400 });

    const requested = String(body?.risk_id ?? '').trim();
    const auto = !!body?.auto || !requested;

    let rows = await loadRiskIds(sr);
    if (!auto && isTaken(rows, requested)) return duplicateResponse(requested);

    const data = Object.fromEntries(FIELDS.filter((k) => k in fields).map((k) => [k, fields[k]]));
    const created = await sr.entities.Risk.create({
      ...data,
      title,
      owner,
      risk_id: auto ? nextAvailableId(rows) : requested,
      version: 0,
    });

    for (let attempt = 0; attempt < MAX_ATTEMPTS; attempt++) {
      rows = await loadRiskIds(sr);
      if (holdsId(rows, created.id)) {
        return Response.json({ record: await sr.entities.Risk.get(created.id) });
      }
      if (!auto) {
        await sr.entities.Risk.delete(created.id);
        return duplicateResponse(requested);
      }
      await sr.entities.Risk.update(created.id, { risk_id: nextAvailableId(rows, created.id) });
    }

    await sr.entities.Risk.delete(created.id);
    return Response.json({ error: 'Too many risks are being logged at once. Please try again.' }, { status: 503 });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
}

serve(handler);
