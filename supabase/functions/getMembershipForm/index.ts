import { createClientFromRequest, serve } from '../_shared/base44.ts';

// Public, unauthenticated endpoint that returns everything the public
// membership form needs to render: the form config, the membership structures
// the admin chose to expose, and the membership custom field definitions.
serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const body = await req.json().catch(() => ({}));
    const slug = body.slug || 'default';

    const configs = await base44.asServiceRole.entities.MembershipFormConfig.filter({ slug });
    const config = configs[0] || null;

    if (!config || config.status === 'disabled') {
      return Response.json({ available: false, config: null, structures: [], customFields: [] });
    }

    const allStructures = await base44.asServiceRole.entities.MembershipStructure.list();
    const ids = config.selected_structure_ids || [];
    const structures = allStructures.filter((s) => ids.includes(s.id) && s.status !== 'archived');

    // Membership custom field definitions live in the shared custom_fields
    // AppConfig record under the 'membership' object key.
    const cfRecords = await base44.asServiceRole.entities.AppConfig.filter({ key: 'custom_fields' });
    const customFields = cfRecords[0]?.settings?.membership || [];

    return Response.json({ available: true, config, structures, customFields });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
}, { public: true });