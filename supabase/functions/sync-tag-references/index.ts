import { createClientFromRequest, serve } from '../_shared/base44.ts';
import { stripTagId } from '../_shared/tagRefs.ts';

/**
 * Keeps Tag references consistent when a tag is removed from the registry.
 *
 * Payload: { operation: 'deleteTag', tagId: string }
 *
 * Deleting a tag strips its ID from every Contact, Member and saved smart
 * group before the Tag record itself is removed, so no record is ever left
 * pointing at a tag that no longer exists.
 */
export default async function handler(req: Request): Promise<Response> {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });

    const body = await req.json();
    const { operation, tagId } = body || {};

    if (operation !== 'deleteTag') {
      return Response.json({ error: 'Unknown operation: ' + operation }, { status: 400 });
    }
    if (!tagId) {
      return Response.json({ error: 'tagId is required' }, { status: 400 });
    }

    // Sweeping every record requires service-role reach beyond the caller's rows.
    const db = base44.asServiceRole;
    const updated = await stripTagId(db, tagId);
    await db.entities.Tag.delete(tagId);

    return Response.json({ success: true, tagId, recordsUpdated: updated });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
}

serve(handler);
