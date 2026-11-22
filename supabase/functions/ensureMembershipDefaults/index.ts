import { createClientFromRequest, serve } from '../_shared/base44.ts';
import { DEFAULT_STRUCTURES } from '../_shared/defaultMembershipStructures.ts';

/**
 * Idempotently ensure the system default membership plans exist, server-side.
 *
 * Runs the whole check-create-dedupe cycle in one request so concurrent app
 * sessions cannot each seed their own copy: duplicates of a default name are
 * collapsed onto the oldest record (members reassigned to the survivor) before
 * the response returns. Failures are returned to the caller, never swallowed.
 */
export default async function handler(req: Request): Promise<Response> {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });

    const defaultNames = DEFAULT_STRUCTURES.map((d) => d.name);
    let created = 0;
    let deduped = 0;
    let reassigned = 0;

    // 1. Collapse duplicates of any default plan name onto the oldest record.
    const existing = await base44.asServiceRole.entities.MembershipStructure.list('created_date');
    for (const name of defaultNames) {
      const matches = existing.filter((s) => s.name === name);
      if (matches.length <= 1) continue;
      const survivor = matches[0];
      for (const dup of matches.slice(1)) {
        const members = await base44.asServiceRole.entities.Member.filter({ membership_structure_id: dup.id });
        if (members.length > 0) {
          await base44.asServiceRole.entities.Member.bulkUpdate(
            members.map((m) => ({
              id: m.id,
              membership_structure_id: survivor.id,
              membership_structure_name: survivor.name,
            }))
          );
          reassigned += members.length;
        }
        await base44.asServiceRole.entities.MembershipStructure.delete(dup.id);
        deduped += 1;
      }
    }

    // 2. Re-read after the dedupe pass, then create only what is still missing.
    const current = await base44.asServiceRole.entities.MembershipStructure.list('created_date');
    const currentNames = new Set(current.map((s) => s.name));
    const missing = DEFAULT_STRUCTURES.filter((d) => !currentNames.has(d.name));
    if (missing.length > 0) {
      await base44.asServiceRole.entities.MembershipStructure.bulkCreate(missing);
      created = missing.length;
    }

    return Response.json({ ok: true, created, deduped, reassigned });
  } catch (error) {
    return Response.json({ ok: false, error: error.message }, { status: 500 });
  }
}

serve(handler);
