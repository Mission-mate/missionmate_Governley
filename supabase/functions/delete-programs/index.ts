import { createClientFromRequest, serve } from '../_shared/base44.ts';
import { cleanIds } from '../_shared/cascadeKit.ts';
import { cascadeDeleteProgram, runEach } from '../_shared/programCascade.ts';

const MAX_PER_REQUEST = 25;

/**
 * Delete programs with their projects and every record either owns (see shared/programCascade.ts).
 * Each program is deleted only after its cleanup is verified; a failed program stays for retry.
 * Returns { ok, deleted, failed: [{ id, title, stage, error }], missing, removed }.
 */
export default async function handler(req: Request): Promise<Response> {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me().catch((e) => (e.status === 401 ? null : Promise.reject(e)));
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });

    const body = await req.json().catch(() => ({}));
    const ids = cleanIds(body?.program_ids);
    if (!ids.length) return Response.json({ error: 'program_ids is required' }, { status: 400 });
    if (ids.length > MAX_PER_REQUEST) return Response.json({ error: `At most ${MAX_PER_REQUEST} programs per request` }, { status: 400 });

    const svc = base44.entities;
    const page = await svc.Program.filter({ id: { $in: ids } }, { limit: MAX_PER_REQUEST });
    const programs = page.items || [];
    const missing = ids.filter((id) => !programs.some((p: any) => p.id === id));

    const result = await runEach(programs, (id, tally) => cascadeDeleteProgram(svc, id, tally));
    return Response.json({ ...result, missing });
  } catch (error) {
    return Response.json({ ok: false, error: error.message }, { status: 500 });
  }
}

serve(handler);
