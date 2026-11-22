import { createClientFromRequest, serve } from '../_shared/base44.ts';

/**
 * Cascade a membership plan rename (and tier renames) onto the cached
 * membership_structure_name / membership_tier_name fields of every member on
 * that plan, and onto the cached membership_structure_name of every membership
 * submission (MembershipApplicationResponse) recorded against that plan.
 * Idempotent: only records whose cached values differ are written.
 *
 * Note: submission membership_structure_id, member_name and answers are
 * point-in-time snapshots and are never rewritten here. Tier deletion is also
 * not handled — members keep their tier id and cached tier name.
 *
 * Payload: { structureId }
 */
export default async function handler(req: Request): Promise<Response> {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });

    const { structureId } = await req.json();
    if (!structureId) return Response.json({ error: 'structureId is required' }, { status: 400 });

    const structure = await base44.entities.MembershipStructure.get(structureId);
    if (!structure) return Response.json({ error: 'Membership plan not found' }, { status: 404 });

    const tierNames = new Map();
    (structure.tiers || []).forEach((t) => {
      if (t?.id) tierNames.set(t.id, t.name || '');
    });

    const members = await base44.entities.Member.filter({ membership_structure_id: structureId });

    const payloads = [];
    for (const m of members) {
      const next = {};
      if ((m.membership_structure_name || '') !== (structure.name || '')) {
        next.membership_structure_name = structure.name || '';
      }
      if (m.membership_tier_id && tierNames.has(m.membership_tier_id)) {
        const tierName = tierNames.get(m.membership_tier_id);
        if ((m.membership_tier_name || '') !== tierName) next.membership_tier_name = tierName;
      }
      if (Object.keys(next).length > 0) payloads.push({ id: m.id, ...next });
    }

    for (let i = 0; i < payloads.length; i += 500) {
      await base44.entities.Member.bulkUpdate(payloads.slice(i, i + 500));
    }

    // Cascade the plan rename onto membership submissions for the same plan.
    const submissions = await base44.entities.MembershipApplicationResponse.filter({
      membership_structure_id: structureId,
    });
    const subPayloads = submissions.
      filter((s) => (s.membership_structure_name || '') !== (structure.name || '')).
      map((s) => ({ id: s.id, membership_structure_name: structure.name || '' }));

    for (let i = 0; i < subPayloads.length; i += 500) {
      await base44.entities.MembershipApplicationResponse.bulkUpdate(subPayloads.slice(i, i + 500));
    }

    return Response.json({
      updated: payloads.length,
      scanned: members.length,
      members_updated: payloads.length,
      submissions_updated: subPayloads.length,
      submissions_scanned: submissions.length,
    });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
}

serve(handler);
