import { createClientFromRequest, serve } from '../_shared/base44.ts';

/**
 * Reports which calendar connector (if any) is authorized for this app.
 * Returns { connected: 'googlecalendar' | 'outlook' | null }.
 */
serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });

    const check = async (type) => {
      try {
        const conn = await base44.asServiceRole.connectors.getConnection(type);
        return !!conn?.accessToken;
      } catch (_e) {
        return false;
      }
    };

    if (await check('googlecalendar')) return Response.json({ connected: 'googlecalendar' });
    if (await check('outlook')) return Response.json({ connected: 'outlook' });
    return Response.json({ connected: null });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});