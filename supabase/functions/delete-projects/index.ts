import { createClientFromRequest, serve } from '../_shared/base44.ts';
import { cleanIds } from '../_shared/cascadeKit.ts';
import { cascadeDeleteProject, runEach } from '../_shared/programCascade.ts';

const MAX_PER_REQUEST = 25;

/**
 * Delete projects of one program with every record they own (see shared/programCascade.ts).
 * Only projects that belong to program_id are touched. Each project is deleted only after its
 * cleanup is verified; a failed project stays for retry.
 * Returns { ok, deleted, failed: [{ id, title, stage, error }], missing, removed }.
 */
export default async function handler(req: Request): Promise<Response> {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me().catch((e) => (e.status === 401 ? null : Promise.reject(e)));
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });

    const body = await req.json().catch(() => ({}));
    const [programId] = cleanIds([body?.program_id]);
    const ids = cleanIds(body?.project_ids);
    if (!programId) return Response.json({ error: 'program_id is required' }, { status: 400 });
    if (!ids.length) return Response.json({ error: 'project_ids is required' }, { status: 400 });
    if (ids.length > MAX_PER_REQUEST) return Response.json({ error: `At most ${MAX_PER_REQUEST} projects per request` }, { status: 400 });

    const svc = base44.entities;
    const page = await svc.Project.filter({ id: { $in: ids }, program_id: programId }, { limit: MAX_PER_REQUEST });
    const projects = page.items || [];
    // Ids that are already gone or belong to another program are reported, never touched.
    const missing = ids.filter((id) => !projects.some((p: any) => p.id === id));

    const result = await runEach(projects, (id, tally) => cascadeDeleteProject(svc, id, tally));
    return Response.json({ ...result, missing });
  } catch (error) {
    return Response.json({ ok: false, error: error.message }, { status: 500 });
  }
}

serve(handler);
