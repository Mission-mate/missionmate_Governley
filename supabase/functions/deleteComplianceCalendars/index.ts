import { createClientFromRequest, serve } from '../_shared/base44.ts';
import { cleanIds, runEach } from '../_shared/cascadeKit.ts';
import { cascadeDeleteCalendar } from '../_shared/obligationCascade.ts';

const MAX_PER_REQUEST = 25;

/**
 * Delete compliance calendars with every obligation they own and each obligation's
 * checklist, notes, documents and folders (see shared/obligationCascade.ts).
 * Each calendar is deleted only after its cleanup is verified; a failed calendar stays for retry.
 * Returns { ok, deleted, failed: [{ id, title, stage, error }], missing, removed }.
 */
export default async function handler(req: Request): Promise<Response> {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me().catch((e) => (e.status === 401 ? null : Promise.reject(e)));
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });

    const body = await req.json().catch(() => ({}));
    const ids = cleanIds(body?.calendar_ids);
    if (!ids.length) return Response.json({ error: 'calendar_ids is required' }, { status: 400 });
    if (ids.length > MAX_PER_REQUEST) return Response.json({ error: `At most ${MAX_PER_REQUEST} calendars per request` }, { status: 400 });

    const svc = base44.entities;
    const page = await svc.ComplianceRegister.filter({ id: { $in: ids } }, { limit: MAX_PER_REQUEST });
    const calendars = page.items || [];
    const missing = ids.filter((id) => !calendars.some((c: any) => c.id === id));

    const result = await runEach(calendars, (id, tally) => cascadeDeleteCalendar(svc, id, tally));
    return Response.json({ ...result, missing });
  } catch (error) {
    return Response.json({ ok: false, error: error.message }, { status: 500 });
  }
}

serve(handler);
