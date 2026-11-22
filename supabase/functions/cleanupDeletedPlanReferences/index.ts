import { createClientFromRequest, serve } from '../_shared/base44.ts';

/**
 * Remove all references to a deleted membership plan from every
 * MembershipFormConfig record:
 *  - selected_structure_ids     — the plan is dropped from the exposed list
 *  - structure_rules[]          — any rule for the plan is removed entirely
 *  - field_layout[].visibility_plans — the plan id is removed from each array
 *
 * Membership submissions (MembershipApplicationResponse) are deliberately left
 * untouched: their membership_structure_id and cached plan name are a
 * point-in-time historical snapshot.
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

    const configs = await base44.entities.MembershipFormConfig.list();
    const payloads = [];

    for (const cfg of configs) {
      const next = {};

      const ids = cfg.selected_structure_ids || [];
      if (ids.includes(structureId)) {
        next.selected_structure_ids = ids.filter((id) => id !== structureId);
      }

      const rules = cfg.structure_rules || [];
      if (rules.some((r) => r?.structure_id === structureId)) {
        next.structure_rules = rules.filter((r) => r?.structure_id !== structureId);
      }

      const layout = cfg.field_layout || [];
      if (layout.some((f) => Array.isArray(f?.visibility_plans) && f.visibility_plans.includes(structureId))) {
        next.field_layout = layout.map((f) =>
          Array.isArray(f?.visibility_plans) && f.visibility_plans.includes(structureId)
            ? { ...f, visibility_plans: f.visibility_plans.filter((id) => id !== structureId) }
            : f
        );
      }

      if (Object.keys(next).length > 0) payloads.push({ id: cfg.id, ...next });
    }

    for (let i = 0; i < payloads.length; i += 500) {
      await base44.entities.MembershipFormConfig.bulkUpdate(payloads.slice(i, i + 500));
    }

    return Response.json({ configs_scanned: configs.length, configs_updated: payloads.length });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
}

serve(handler);
