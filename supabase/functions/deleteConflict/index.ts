import { createClientFromRequest, serve } from '../_shared/base44.ts';
import { cascadeDeleteConflict } from '../_shared/conflictCascade.ts';

/**
 * Delete a Conflict of Interest record together with the actions, notes and
 * documents that only exist because of it. The cascade lives in
 * shared/conflictCascade.ts so any future caller removes conflicts identically.
 */
export default async function handler(req: Request): Promise<Response> {
  try {
    const base44 = createClientFromRequest(req);

    const user = await base44.auth.me();
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });
    if (user.role !== 'admin') return Response.json({ error: 'Forbidden' }, { status: 403 });

    const body = await req.json().catch(() => ({}));
    const conflictId = body?.conflict_id;
    if (!conflictId) {
      return Response.json({ error: 'conflict_id is required' }, { status: 400 });
    }

    const result = await cascadeDeleteConflict(base44.asServiceRole.entities, conflictId);

    if (!result.ok) {
      return Response.json({ error: 'not_found' }, { status: 404 });
    }

    return Response.json(result);
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
}

serve(handler);
