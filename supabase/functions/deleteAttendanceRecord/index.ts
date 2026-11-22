import { createClientFromRequest, serve } from '../_shared/base44.ts';

/**
 * Guarded bulk delete. Mirrors deleteAllWhere in src/lib/cascadeDelete.js, which
 * cannot be imported here because it targets the client-side entities client.
 * The query MUST be specific — an empty or blank-valued query is rejected so a
 * cascade can never widen into "delete everything".
 */
function assertSpecificQuery(entityName: string, query: Record<string, unknown>) {
  const keys = Object.keys(query || {});
  if (keys.length === 0) {
    throw new Error(`Refusing to delete ${entityName} records without a specific query.`);
  }
  const hasBlank = keys.some((k) => query[k] === undefined || query[k] === null || query[k] === '');
  if (hasBlank) {
    throw new Error(`Refusing to delete ${entityName} records — query contains an empty value.`);
  }
}

/**
 * Permanently delete a board person's attendance history plus their
 * BoardPerson record. Blocked while the person is still linked to the
 * Committee Members Register (audit protection) — the register must be
 * cleaned up first.
 */
export default async function handler(req: Request): Promise<Response> {
  // Progress tracked outside the try so a mid-cascade failure can report exactly
  // how far the cascade got. Not transactional — the platform has no database
  // transactions — but bulk deletes mean fewer failure points, and re-running
  // converges because already-removed rows simply match nothing.
  let stage = 'validation';
  let deletedParticipants = 0;
  let deletedSkills = 0;
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });
    if (user.role !== 'admin') return Response.json({ error: 'Forbidden' }, { status: 403 });

    const { board_person_id: personId } = await req.json();
    if (!personId) return Response.json({ error: 'board_person_id is required' }, { status: 400 });

    const svc = base44.asServiceRole.entities;
    const person = await svc.BoardPerson.get(personId).catch(() => null);

    // The Committee Members Register IS the BoardPerson list. While the record
    // exists the person is still in the register, so deleting their attendance
    // history is refused — the register must be cleaned up first.
    if (person) {
      return Response.json({ error: 'still_in_committee_register' }, { status: 409 });
    }

    const [participants, skills] = await Promise.all([
      svc.MeetingParticipant.filter({ board_person_id: personId }),
      svc.MemberSkill.filter({ person_id: personId }),
    ]);

    // Children first, parent last.
    stage = 'participants';
    if (participants.length) {
      const q = { board_person_id: personId };
      assertSpecificQuery('MeetingParticipant', q);
      await svc.MeetingParticipant.deleteMany(q);
      deletedParticipants = participants.length;
    }

    stage = 'skills';
    if (skills.length) {
      const q = { person_id: personId };
      assertSpecificQuery('MemberSkill', q);
      await svc.MemberSkill.deleteMany(q);
      deletedSkills = skills.length;
    }

    // No BoardPerson to remove — the register entry is already gone (that is the
    // only way execution reaches here); this path only clears orphaned children.

    return Response.json({
      ok: true,
      deleted_participants: deletedParticipants,
      deleted_skills: deletedSkills,
    });
  } catch (error) {
    // Never report success on a partial cascade — name the stage that failed and
    // what was already removed so the caller knows the true state before retrying.
    return Response.json(
      {
        error: error.message,
        failed_stage: stage,
        deleted_participants: deletedParticipants,
        deleted_skills: deletedSkills,
      },
      { status: 500 }
    );
  }
}

serve(handler);
