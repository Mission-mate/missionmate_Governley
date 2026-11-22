import { createClientFromRequest, serve } from '../_shared/base44.ts';
import { cleanIds, runEach } from '../_shared/cascadeKit.ts';
import { cascadeDeleteRecord, RECORD_ENTITIES } from '../_shared/registerCascade.ts';

const MAX_PER_REQUEST = 100;

/**
 * Delete individual compliance register records (assets, responsible people) with the
 * maintenance entries, notes, documents and folders they own (see shared/registerCascade.ts).
 * Each record is deleted only after its cleanup is verified; a failed record stays for retry.
 * Returns { ok, deleted, failed: [{ id, title, stage, error }], missing, removed }.
 */
export default async function handler(req: Request): Promise<Response> {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me().catch((e) => (e.status === 401 ? null : Promise.reject(e)));
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });

    const body = await req.json().catch(() => ({}));
    const entity = body?.entity;
    if (!RECORD_ENTITIES.includes(entity)) return Response.json({ error: 'Unsupported entity' }, { status: 400 });
    const ids = cleanIds(body?.record_ids);
    if (!ids.length) return Response.json({ error: 'record_ids is required' }, { status: 400 });
    if (ids.length > MAX_PER_REQUEST) return Response.json({ error: `At most ${MAX_PER_REQUEST} records per request` }, { status: 400 });

    const svc = base44.entities;
    const page = await svc[entity].filter({ id: { $in: ids } }, { limit: MAX_PER_REQUEST });
    const records = (page.items || []).map((r: any) => ({ id: r.id, title: r.title || r.full_name || '' }));
    const missing = ids.filter((id) => !records.some((r: any) => r.id === id));

    const result = await runEach(records, (id, tally) => cascadeDeleteRecord(svc, entity, id, tally));
    return Response.json({ ...result, missing });
  } catch (error) {
    return Response.json({ ok: false, error: error.message }, { status: 500 });
  }
}

serve(handler);
