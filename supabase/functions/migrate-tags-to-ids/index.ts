import { createClientFromRequest, serve } from '../_shared/base44.ts';
import { migrateTagNamesToIds } from '../_shared/tagRefs.ts';

/**
 * One-time migration: converts legacy tag-*name* references on Contact.tags,
 * Member.tags and SmartList.filters.tags into Tag **IDs**.
 *
 * Payload: { dryRun?: boolean }
 *   dryRun = true reports what would change without writing anything.
 *
 * Safe to re-run: entries that are already Tag IDs are left untouched, so a
 * second run reports zero changes.
 */
export default async function handler(req: Request): Promise<Response> {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });
    if (user.role !== 'admin') {
      return Response.json({ error: 'Forbidden' }, { status: 403 });
    }

    const body = await req.json().catch(() => ({}));
    const dryRun = !!body?.dryRun;

    const summary = await migrateTagNamesToIds(base44.asServiceRole, { dryRun });

    return Response.json({ success: true, dryRun, ...summary });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
}

serve(handler);
