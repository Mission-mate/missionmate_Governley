import { createClientFromRequest, serve } from '../_shared/base44.ts';
import { cascadeDeleteStrategy, CascadeError } from '../_shared/strategyCascade.ts';

/** Delete a strategy and every record it owns (see shared/strategyCascade.ts). */
export default async function handler(req: Request): Promise<Response> {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me().catch((e) => (e.status === 401 ? null : Promise.reject(e)));
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });

    const { strategy_id } = await req.json().catch(() => ({}));
    if (typeof strategy_id !== 'string' || !strategy_id.trim()) {
      return Response.json({ error: 'strategy_id is required' }, { status: 400 });
    }

    const svc = base44.entities;
    const strategy = await svc.Strategy.get(strategy_id).catch((e) => (e.status === 404 ? null : Promise.reject(e)));
    if (!strategy) return Response.json({ error: 'not_found' }, { status: 404 });

    const deleted = await cascadeDeleteStrategy(svc, strategy_id);
    return Response.json({ ok: true, deleted });
  } catch (error) {
    const stage = error instanceof CascadeError ? error.stage : null;
    return Response.json({ ok: false, error: error.message, stage }, { status: 500 });
  }
}

serve(handler);
