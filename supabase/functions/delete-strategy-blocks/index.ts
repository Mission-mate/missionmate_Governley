import { createClientFromRequest, serve } from '../_shared/base44.ts';
import { cascadeDeleteBlocks, clearConnectionsTo, cleanIds, withDescendants, CascadeError } from '../_shared/strategyCascade.ts';

/** Delete strategy blocks with their child items, tasks, subtasks, reports, notes and documents. */
export default async function handler(req: Request): Promise<Response> {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me().catch((e) => (e.status === 401 ? null : Promise.reject(e)));
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });

    const body = await req.json().catch(() => ({}));
    const ids = cleanIds(body?.block_ids);
    if (ids.length === 0) return Response.json({ error: 'block_ids is required' }, { status: 400 });

    const svc = base44.entities;
    // Only blocks that still exist are cascaded; already-removed ids are treated as done.
    const blocks = await svc.StrategyBlock.filter({ id: { $in: ids } }, { limit: ids.length });
    const found = blocks.items || [];
    if (found.length === 0) return Response.json({ ok: true, deleted: {} });

    // Child items at every depth go with their parent, deepest first.
    const allIds = await withDescendants(svc, found.map((b) => b.id));
    const deleted = await cascadeDeleteBlocks(svc, allIds);
    // Descendants always share their root's strategy.
    const strategyIds = [...new Set(found.map((b) => b.strategy_id).filter(Boolean))];
    for (const strategyId of strategyIds) await clearConnectionsTo(svc, strategyId, allIds);

    return Response.json({ ok: true, deleted, strategy_ids: strategyIds });
  } catch (error) {
    const stage = error instanceof CascadeError ? error.stage : null;
    return Response.json({ ok: false, error: error.message, stage }, { status: 500 });
  }
}

serve(handler);
