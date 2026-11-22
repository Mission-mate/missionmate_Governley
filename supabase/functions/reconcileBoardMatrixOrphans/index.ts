import { createClientFromRequest, serve } from '../_shared/base44.ts';

/**
 * Re-entrant cleanup for orphaned Board Matrix child records.
 *
 * Cascades run client-side and are not transactional, so a browser closed
 * mid-delete can leave children pointing at a parent that no longer exists.
 * This sweep finds those rows and removes them. Idempotent — running it twice
 * simply reports zero the second time.
 */
async function listAll(collection) {
  const out = [];
  let skip = 0;
  const limit = 500;
  for (;;) {
    const page = await collection.list('-created_date', limit, skip);
    out.push(...page);
    if (page.length < limit) break;
    skip += limit;
  }
  return out;
}

export default async function handler(req: Request): Promise<Response> {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });
    if (user.role !== 'admin') return Response.json({ error: 'Forbidden' }, { status: 403 });

    const db = base44.asServiceRole.entities;

    const [skills, categories, options, people] = await Promise.all([
      listAll(db.BoardSkill),
      listAll(db.BoardCategory),
      listAll(db.BoardCategoryOption),
      listAll(db.BoardPerson),
    ]);
    const skillIds = new Set(skills.map((r) => r.id));
    const categoryIds = new Set(categories.map((r) => r.id));
    const optionIds = new Set(options.map((r) => r.id));
    const personIds = new Set(people.map((r) => r.id));

    const [memberSkills, memberAttributes, committeeMembers, meetingParticipants] = await Promise.all([
      listAll(db.MemberSkill),
      listAll(db.MemberAttribute),
      listAll(db.CommitteeMember),
      listAll(db.MeetingParticipant),
    ]);

    const orphanIds = {
      MemberSkill: memberSkills
        .filter((r) => !skillIds.has(r.skill_id) || (r.person_id && !personIds.has(r.person_id)))
        .map((r) => r.id),
      MemberAttribute: memberAttributes
        .filter((r) => !categoryIds.has(r.category_id) || !optionIds.has(r.option_id) || (r.person_id && !personIds.has(r.person_id)))
        .map((r) => r.id),
      // Legacy rows saved without board_person_id are left alone — they have no parent link to check.
      CommitteeMember: committeeMembers
        .filter((r) => r.board_person_id && !personIds.has(r.board_person_id))
        .map((r) => r.id),
      MeetingParticipant: meetingParticipants
        .filter((r) => r.board_person_id && !personIds.has(r.board_person_id))
        .map((r) => r.id),
    };

    const cleaned = {};
    for (const [entity, ids] of Object.entries(orphanIds)) {
      if (ids.length) {
        // Targeted by id — never a broad query that could widen into "delete everything".
        await db[entity].deleteMany({ id: { $in: ids } });
      }
      cleaned[entity] = ids.length;
    }

    return Response.json({
      cleaned: {
        memberSkills: cleaned.MemberSkill,
        memberAttributes: cleaned.MemberAttribute,
        committeeMembers: cleaned.CommitteeMember,
        meetingParticipants: cleaned.MeetingParticipant,
      },
      total: Object.values(cleaned).reduce((a, b) => a + b, 0),
    });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
}

serve(handler);
