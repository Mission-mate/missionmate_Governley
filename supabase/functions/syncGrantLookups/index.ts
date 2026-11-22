import { createClientFromRequest, serve } from '../_shared/base44.ts';
import {
  LOOKUP_CONFIG,
  LOOKUP_ENTITIES,
  findNameCollision,
  listAll,
  nameKey,
  reconcileGrantLookups,
} from '../_shared/grantLookups.ts';

/**
 * Referential integrity for the Grant lookup entities (GrantProvider / GrantActivity).
 *
 * Actions:
 *  - create    : creates a lookup, rejecting a case-insensitive duplicate name.
 *  - rename    : renames the lookup AND every linked grant's cached name. On any
 *                propagation failure the whole operation is rolled back, so a
 *                caller never ends up with a renamed lookup and stale grants.
 *  - delete    : blocked while any grant still links to the record (reassign first).
 *  - reconcile : repairs drifted cached names and back-fills missing ID links.
 *                Used by the nightly automation; also callable by an admin.
 */
export default async function handler(req: Request): Promise<Response> {
  try {
    const base44 = createClientFromRequest(req);
    const body = await req.json().catch(() => ({}));
    const { entity, action, id, name } = body || {};

    if (!action) return Response.json({ error: 'action is required' }, { status: 400 });

    // The nightly automation runs with no user context — allow it through, but any
    // authenticated caller must be an admin to trigger a full reconcile pass.
    if (action === 'reconcile') {
      const isAuthed = await base44.auth.isAuthenticated().catch(() => false);
      if (isAuthed) {
        const user = await base44.auth.me();
        if (!user || user.role !== 'admin') {
          return Response.json({ error: 'Forbidden' }, { status: 403 });
        }
      }
      const result = await reconcileGrantLookups(base44.asServiceRole);
      console.log('Grant lookup reconcile complete', JSON.stringify(result));
      return Response.json({ ok: true, ...result });
    }

    // Every other action is a user-initiated write.
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });

    if (!LOOKUP_ENTITIES.includes(entity)) {
      return Response.json({ error: 'Unknown lookup entity' }, { status: 400 });
    }
    const { idField, nameField, label } = LOOKUP_CONFIG[entity];
    const db = base44.entities;

    if (action === 'create') {
      const trimmed = String(name || '').trim();
      if (!trimmed) return Response.json({ error: 'A name is required' }, { status: 400 });

      const records = await listAll(base44.asServiceRole, entity);
      const clash = findNameCollision(records, trimmed, null);
      if (clash) {
        return Response.json(
          {
            error: 'duplicate_name',
            message: `A ${label} named "${clash.name}" already exists — select it instead.`,
            existing: { id: clash.id, name: clash.name },
          },
          { status: 409 }
        );
      }

      const created = await db[entity].create({ name: trimmed });
      return Response.json({ ok: true, record: { id: created.id, name: created.name } });
    }

    if (!id) return Response.json({ error: 'id is required' }, { status: 400 });
    const record = await db[entity].get(id);
    if (!record) return Response.json({ error: `That ${label} no longer exists` }, { status: 404 });

    if (action === 'rename') {
      const trimmed = String(name || '').trim();
      if (!trimmed) return Response.json({ error: 'A name is required' }, { status: 400 });

      if (nameKey(trimmed) === nameKey(record.name) && trimmed === record.name) {
        return Response.json({ ok: true, record: { id, name: record.name }, grantsUpdated: 0 });
      }

      const records = await listAll(base44.asServiceRole, entity);
      const clash = findNameCollision(records, trimmed, id);
      if (clash) {
        return Response.json(
          {
            error: 'duplicate_name',
            message: `A ${label} named "${clash.name}" already exists — select it instead.`,
            existing: { id: clash.id, name: clash.name },
          },
          { status: 409 }
        );
      }

      const previousName = record.name || '';
      const linked = await base44.asServiceRole.entities.Grant.filter({ [idField]: id });
      const batches = [];
      for (let i = 0; i < linked.length; i += 500) batches.push(linked.slice(i, i + 500));

      await db[entity].update(id, { name: trimmed });

      const applied = [];
      try {
        for (const batch of batches) {
          await base44.asServiceRole.entities.Grant.bulkUpdate(
            batch.map((g) => ({ id: g.id, [nameField]: trimmed }))
          );
          applied.push(batch);
        }
      } catch (propagationError) {
        // Roll everything back so the rename is all-or-nothing.
        for (const batch of applied) {
          await base44.asServiceRole.entities.Grant
            .bulkUpdate(batch.map((g) => ({ id: g.id, [nameField]: g[nameField] || previousName })))
            .catch(() => {});
        }
        await db[entity].update(id, { name: previousName }).catch(() => {});
        return Response.json(
          {
            error: 'propagation_failed',
            message: `The ${label} could not be renamed because its linked grants could not be updated. Nothing was changed — please try again.`,
            detail: propagationError.message,
          },
          { status: 500 }
        );
      }

      return Response.json({
        ok: true,
        record: { id, name: trimmed },
        grantsUpdated: linked.length,
      });
    }

    if (action === 'delete') {
      const linked = await base44.asServiceRole.entities.Grant.filter({ [idField]: id });
      if (linked.length > 0) {
        return Response.json(
          {
            error: 'still_linked',
            message: `${record.name} is linked to ${linked.length} grant${linked.length !== 1 ? 's' : ''}. Reassign them first.`,
            linkedCount: linked.length,
          },
          { status: 409 }
        );
      }
      await db[entity].delete(id);
      return Response.json({ ok: true, deletedId: id });
    }

    return Response.json({ error: `Unsupported action "${action}"` }, { status: 400 });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
}

serve(handler);
