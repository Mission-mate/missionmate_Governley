import { createClientFromRequest, serve } from '../_shared/base44.ts';
import { cleanIds, withRetry } from '../_shared/cascadeKit.ts';

const MAX_BATCHES = 40;   // updateMany handles up to 500 per call → 20k projects per run
const SWEEP_LIMIT = 25;
const PAGE = 500;

const orNull = (e: any) => (e?.status === 404 ? null : Promise.reject(e));

/**
 * Copy one program's current title onto every linked project's cached program_title.
 * Never atomic: it converges. The title is re-read before every batch, so a run started
 * for an older rename always writes the newest title and can never revert one. Only
 * projects holding a different title are written, so repeating a run is safe.
 */
async function syncOne(svc: any, programId: string) {
  let program = await withRetry('Program', () => svc.Program.get(programId).catch(orNull));
  if (!program) return { program_id: programId, skipped: 'program_not_found' };

  let updated = 0;
  try {
    let stale = 0;
    for (let i = 0; i < MAX_BATCHES; i++) {
      program = await withRetry('Program', () => svc.Program.get(programId).catch(orNull));
      if (!program) return { program_id: programId, skipped: 'program_not_found', updated };
      const staleQuery = { program_id: programId, program_title: { $ne: program.title } };
      stale = await withRetry('Project', () => svc.Project.count(staleQuery));
      if (!stale) break;
      const title = program.title;
      await withRetry('Project', () => svc.Project.updateMany(staleQuery, { $set: { program_title: title } }));
      const left = await withRetry('Project', () => svc.Project.count(staleQuery));
      updated += stale - left;
      stale = left;
    }

    if (stale > 0) {
      // Bounded run ended with work left: stay pending so the next sweep resumes.
      await svc.Program.update(programId, { title_sync_status: 'pending', title_sync_error: '' });
      return { program_id: programId, status: 'pending', updated, remaining: stale };
    }
    if (program.title_sync_status !== 'synced' || program.title_sync_attempts || program.title_sync_error) {
      await svc.Program.update(programId, {
        title_sync_status: 'synced', title_sync_error: '', title_sync_attempts: 0, title_synced_at: new Date().toISOString(),
      });
    }
    return { program_id: programId, status: 'synced', updated };
  } catch (error) {
    const message = error?.message || String(error);
    await svc.Program.update(programId, {
      title_sync_status: 'failed', title_sync_error: message, title_sync_attempts: (program?.title_sync_attempts || 0) + 1,
    }).catch(() => null);
    return { program_id: programId, status: 'failed', updated, error: message };
  }
}

async function allProgramIds(svc: any, query: Record<string, unknown>, cap = Infinity) {
  const ids: string[] = [];
  let cursor: string | undefined;
  do {
    const page = await withRetry('Program', () => svc.Program.filter(query, { sort: 'updated_date', limit: PAGE, ...(cursor ? { cursor } : {}) }));
    (page.items || []).forEach((p: any) => ids.push(p.id));
    cursor = page.has_more && ids.length < cap ? page.next_cursor : undefined;
  } while (cursor);
  return ids.slice(0, cap);
}

/**
 * Modes:
 *  { program_id }            — sync one program (workflow trigger, manual Retry).
 *  { mode: 'sweep' }         — admin: resume up to 25 pending/failed programs (scheduled).
 *  { mode: 'reconcile_all' } — admin: one-time pass over every program; resumable.
 */
export default async function handler(req: Request): Promise<Response> {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me().catch((e) => (e.status === 401 ? null : Promise.reject(e)));
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });

    const body = await req.json().catch(() => ({}));
    const svc = base44.asServiceRole.entities;

    if (body?.program_id) {
      const [programId] = cleanIds([body.program_id]);
      if (!programId) return Response.json({ error: 'Invalid program_id' }, { status: 400 });
      return Response.json({ ok: true, results: [await syncOne(svc, programId)] });
    }

    if (body?.mode !== 'sweep' && body?.mode !== 'reconcile_all') {
      return Response.json({ error: 'program_id or mode is required' }, { status: 400 });
    }
    if (user.role !== 'admin') return Response.json({ error: 'Forbidden' }, { status: 403 });

    const ids = body.mode === 'sweep'
      ? await allProgramIds(svc, { title_sync_status: { $in: ['pending', 'failed'] } }, SWEEP_LIMIT)
      : await allProgramIds(svc, {});
    const results = [];
    for (const id of ids) results.push(await syncOne(svc, id));

    const summary = {
      programs: results.length,
      projects_updated: results.reduce((n, r: any) => n + (r.updated || 0), 0),
      synced: results.filter((r: any) => r.status === 'synced').length,
      pending: results.filter((r: any) => r.status === 'pending').length,
      failed: results.filter((r: any) => r.status === 'failed'),
    };
    return Response.json({ ok: summary.failed.length === 0 && summary.pending === 0, mode: body.mode, ...summary });
  } catch (error) {
    return Response.json({ ok: false, error: error.message }, { status: 500 });
  }
}

serve(handler);
