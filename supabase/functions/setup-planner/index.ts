import { createClientFromRequest, serve } from '../_shared/base44.ts';
import { CascadeError, withRetry } from '../_shared/cascadeKit.ts';
import { PLANNER_SOURCES, ensurePlannerGrid } from '../_shared/plannerSeed.ts';

const FIELDS = ['title', 'description', 'owner', 'date_created', 'status', 'color'];
const STATUSES = ['active', 'completed'];

const orNull = (e: any) => (e?.status === 404 ? null : Promise.reject(e));
const str = (v: unknown) => (typeof v === 'string' ? v.trim() : '');

/**
 * Creates or repairs a Program / Project planner and its starter grid.
 *
 * Create: { kind, owner_id, setup_key, data } — setup_key is generated once per create
 *   attempt by the client, so repeating the request resumes the same planner instead of
 *   creating a second one.
 * Repair: { kind, planner_id } — completes a planner that is still in setup, or adds missing
 *   system columns to an older planner.
 * Returns { planner } once the grid is confirmed; on failure, 503 with { planner_id, retryable }.
 */
export default async function handler(req: Request): Promise<Response> {
  let plannerId: string | null = null;
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me().catch((e) => (e.status === 401 ? null : Promise.reject(e)));
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });

    const body = await req.json().catch(() => ({}));
    const source = PLANNER_SOURCES[body?.kind];
    if (!source) return Response.json({ error: 'kind must be program or project' }, { status: 400 });
    const E = base44.asServiceRole.entities;
    const Planner = E[source.planner];

    let planner: any;
    if (body.planner_id) {
      planner = await Planner.get(str(body.planner_id)).catch(orNull);
      if (!planner) return Response.json({ error: 'not_found' }, { status: 404 });
    } else {
      const ownerId = str(body.owner_id);
      const setupKey = str(body.setup_key);
      if (!ownerId || !setupKey) return Response.json({ error: 'owner_id and setup_key are required' }, { status: 400 });
      const data = Object.fromEntries(FIELDS.map((k) => [k, body.data?.[k]]).filter(([, v]) => v !== undefined && v !== null));
      data.title = str(data.title);
      data.owner = str(data.owner);
      if (!data.title || !data.owner) return Response.json({ error: 'title and owner are required' }, { status: 400 });
      if (data.status && !STATUSES.includes(data.status)) return Response.json({ error: 'invalid status' }, { status: 400 });

      const owner = await E[source.owner].get(ownerId).catch(orNull);
      if (!owner) return Response.json({ error: 'owner_not_found' }, { status: 404 });

      const query = { [source.parentField]: ownerId, setup_key: setupKey };
      const existing = await withRetry('planner lookup', () => Planner.filter(query, { limit: 1 }));
      planner = existing.items?.[0] || await withRetry('planner', () => Planner.create({ ...data, ...query, setup_status: 'pending' }));
    }

    plannerId = planner.id;
    const ready = await ensurePlannerGrid(E, source.planner, planner);
    return Response.json({ planner: ready });
  } catch (error) {
    const retryable = error instanceof CascadeError;
    return Response.json(
      { error: retryable ? 'Your planner could not be fully set up.' : error.message, planner_id: plannerId, retryable },
      { status: retryable ? 503 : 500 },
    );
  }
}

serve(handler);
