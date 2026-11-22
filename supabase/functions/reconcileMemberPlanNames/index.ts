import { createClientFromRequest, serve } from '../_shared/base44.ts';

/**
 * Nightly reconciliation of cached membership plan / tier names.
 *
 * Repairs any Member or MembershipApplicationResponse whose cached
 * membership_structure_name / membership_tier_name drifted from the live
 * MembershipStructure — imports, partial bulk updates, a failed rename cascade
 * or any other non-editor path. Idempotent: only differing rows are written.
 *
 * Tier deletion is deliberately not handled — members keep their tier id and
 * cached tier name when a tier is removed from the plan.
 *
 * No payload. Runs from a scheduled automation (service role).
 */
export default async function handler(req: Request): Promise<Response> {
  try {
    const base44 = createClientFromRequest(req);
    const db = base44.asServiceRole.entities;

    const structures = await db.MembershipStructure.list();
    const byId = new Map();
    structures.forEach((s) => {
      const tierNames = new Map();
      (s.tiers || []).forEach((t) => {
        if (t?.id) tierNames.set(t.id, t.name || '');
      });
      byId.set(s.id, { name: s.name || '', tierNames });
    });

    const flush = async (entity, payloads) => {
      for (let i = 0; i < payloads.length; i += 500) {
        await entity.bulkUpdate(payloads.slice(i, i + 500));
      }
    };

    // Members — plan name + tier name
    const members = await db.Member.list();
    const memberPayloads = [];
    for (const m of members) {
      const live = byId.get(m.membership_structure_id);
      if (!live) continue;
      const next = {};
      if ((m.membership_structure_name || '') !== live.name) {
        next.membership_structure_name = live.name;
      }
      if (m.membership_tier_id && live.tierNames.has(m.membership_tier_id)) {
        const tierName = live.tierNames.get(m.membership_tier_id);
        if ((m.membership_tier_name || '') !== tierName) next.membership_tier_name = tierName;
      }
      if (Object.keys(next).length > 0) memberPayloads.push({ id: m.id, ...next });
    }
    await flush(db.Member, memberPayloads);

    // Submissions — plan name only (all other fields are point-in-time snapshots)
    const submissions = await db.MembershipApplicationResponse.list();
    const subPayloads = [];
    for (const s of submissions) {
      const live = byId.get(s.membership_structure_id);
      if (!live) continue;
      if ((s.membership_structure_name || '') !== live.name) {
        subPayloads.push({ id: s.id, membership_structure_name: live.name });
      }
    }
    await flush(db.MembershipApplicationResponse, subPayloads);

    return Response.json({
      members_scanned: members.length,
      members_updated: memberPayloads.length,
      submissions_scanned: submissions.length,
      submissions_updated: subPayloads.length,
    });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
}

serve(handler);
