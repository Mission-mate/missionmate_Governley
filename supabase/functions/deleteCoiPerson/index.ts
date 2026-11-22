import { createClientFromRequest, serve } from '../_shared/base44.ts';
import { CascadeError } from '../_shared/cascadeKit.ts';
import { cascadeDeleteCoiPerson, linkedQuery } from '../_shared/coiPersonCascade.ts';

/**
 * Delete a Conflict of Interest declarant in one verified server-side cascade
 * (see shared/coiPersonCascade.ts).
 * Body: { register_id, person_id, keep_declarations }.
 * Deleting linked declarations is admin-only and is checked before anything changes,
 * so a non-admin request never removes part of the data.
 * Returns { ok: true, removed } or { ok: false, error, message, stage? }.
 */
export default async function handler(req: Request): Promise<Response> {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me().catch((e) => (e.status === 401 ? null : Promise.reject(e)));
    if (!user) return Response.json({ ok: false, error: 'unauthorized', message: 'Please sign in again.' }, { status: 401 });

    const body = await req.json().catch(() => ({}));
    const registerId = typeof body?.register_id === 'string' ? body.register_id : '';
    const personId = typeof body?.person_id === 'string' ? body.person_id : '';
    const keep = body?.keep_declarations === true;
    if (!registerId || !personId) {
      return Response.json({ ok: false, error: 'bad_request', message: 'register_id and person_id are required.' }, { status: 400 });
    }

    const svc = base44.asServiceRole.entities;
    const person = await svc.CoiPerson.get(personId).catch(() => null);
    if (!person || person.register_id !== registerId) {
      return Response.json({ ok: false, error: 'not_found', message: 'This person no longer exists in this register.' }, { status: 404 });
    }

    if (!keep && user.role !== 'admin') {
      const linked = await svc.ConflictOfInterest.count(linkedQuery(registerId, personId));
      if (linked > 0) {
        return Response.json({
          ok: false,
          error: 'admin_required',
          message: `Only an admin can delete declarations. Ask an admin to delete "${person.full_name}" and their ${linked} declaration${linked === 1 ? '' : 's'}, or choose to keep them.`,
        }, { status: 403 });
      }
    }

    const removed = await cascadeDeleteCoiPerson(svc, registerId, personId, keep);
    return Response.json({ ok: true, removed });
  } catch (error) {
    console.error('deleteCoiPerson failed:', error?.message || error);
    return Response.json({
      ok: false,
      error: 'cascade_failed',
      stage: error instanceof CascadeError ? error.stage : null,
      message: `The person was not deleted: ${error?.message || 'unexpected error'}. Nothing else needs undoing, so you can try again.`,
    }, { status: 500 });
  }
}

serve(handler);
