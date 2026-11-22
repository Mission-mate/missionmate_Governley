/**
 * Live resolution of a member's membership plan / tier name.
 *
 * Members cache the plan and tier name for exports and for records whose plan
 * no longer exists. The live structures list is the source of truth while the
 * plan exists, so a rename shows immediately — the cached value is only a
 * fallback.
 */
const DASH = '–';

export const resolveStructureName = (member, structures = []) => {
  if (!member) return DASH;
  const live = structures.find((s) => s.id === member.membership_structure_id);
  return live?.name || member.membership_structure_name || DASH;
};

export const resolveTierName = (member, structures = []) => {
  if (!member?.membership_tier_id) return member?.membership_tier_name || '';
  const live = structures.find((s) => s.id === member.membership_structure_id);
  const tier = (live?.tiers || []).find((t) => t.id === member.membership_tier_id);
  return tier?.name || member.membership_tier_name || '';
};