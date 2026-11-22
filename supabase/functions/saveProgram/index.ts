import { createClientFromRequest, serve } from '../_shared/base44.ts';
import { cleanIds } from '../_shared/cascadeKit.ts';

const FIELDS = ['title', 'description', 'color', 'start_date', 'end_date', 'program_lead', 'program_lead_id', 'executive_sponsor', 'status'];

/**
 * Save a program's editable fields. A rename only marks the linked projects' cached
 * program_title as pending; the "Sync Program Titles to Projects" workflow copies it
 * in the background (syncProgramTitles), so the save never waits on project updates.
 * Returns { ok: true, program }.
 */
export default async function handler(req: Request): Promise<Response> {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me().catch((e) => (e.status === 401 ? null : Promise.reject(e)));
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });

    const body = await req.json().catch(() => ({}));
    const [programId] = cleanIds([body?.program_id]);
    if (!programId) return Response.json({ error: 'program_id is required' }, { status: 400 });

    const input = body?.data && typeof body.data === 'object' ? body.data : {};
    const data: Record<string, unknown> = {};
    for (const key of FIELDS) if (key in input) data[key] = input[key];
    if ('title' in data) {
      data.title = String(data.title ?? '').trim();
      if (!data.title) return Response.json({ error: 'Program title is required.' }, { status: 400 });
    }

    const svc = base44.entities;
    const existing = await svc.Program.get(programId).catch((e) => (e.status === 404 ? null : Promise.reject(e)));
    if (!existing) return Response.json({ error: 'Program not found' }, { status: 404 });

    if ('title' in data && data.title !== existing.title) {
      Object.assign(data, { title_sync_status: 'pending', title_sync_error: '' });
    }
    const program = Object.keys(data).length ? await svc.Program.update(programId, data) : existing;
    return Response.json({ ok: true, program });
  } catch (error) {
    return Response.json({ ok: false, error: error.message }, { status: 500 });
  }
}

serve(handler);
