import { createClientFromRequest, serve } from '../_shared/base44.ts';
import { reconcile, servedFields } from './state.ts';

/**
 * Policy versions — the only writer of PolicyVersion records (see state.ts).
 * Body: { action: 'list' | 'save' | 'delete', policy_id, ... }
 *   list   → { versions, current_version_id, repairs }
 *   save   → { version_id?, request_key (new versions), form, file?: { file_uri, file_name } }
 *   delete → { version_id }
 * Errors return { ok: false, message } and never leave a second Current version.
 */
const STATUSES = ['Current', 'Superseded'];
const fail = (status: number, message: string) => Response.json({ ok: false, message }, { status });
const ignore404 = (e: any) => (e?.status === 404 ? null : Promise.reject(e));

const clean = (f: any) => ({
  version_number: String(f.version_number || '').trim(), display_title: String(f.display_title || '').trim(), summary: f.summary || '',
  approved_by: String(f.approved_by || '').trim(), approved_date: f.approved_date || null,
  minute_reference: String(f.minute_reference || '').trim(), effective_from: f.effective_from || null,
});

/** Single-write commit: the pointer and the served file change together, then it is verified. */
async function promote(svc: any, version: any) {
  await svc.PolicyDocument.update(version.policy_id, servedFields(version));
  const committed = await svc.PolicyDocument.get(version.policy_id);
  if (committed.current_version_id !== version.id) throw new Error('Another version was made Current at the same time. Refresh and check the versions list');
}

async function save(svc: any, policyId: string, body: any) {
  const form = body.form || {};
  const fields = clean(form);
  if (!fields.version_number) return fail(400, 'Version number is required.');
  if (!fields.display_title) return fail(400, 'Document display title is required.');
  if (!STATUSES.includes(form.status)) return fail(400, 'Choose a valid document status.');
  const file = body.file?.file_uri ? { file_uri: String(body.file.file_uri), file_name: String(body.file.file_name || ''), content_sections: [] } : null;
  const wantsCurrent = form.status === 'Current';

  const state = await reconcile(svc, policyId);
  const currentId = state.current?.id || null;

  if (body.version_id) {
    const existing = state.versions.find((v: any) => v.id === body.version_id);
    if (!existing) return fail(404, 'This version no longer exists.');
    const isCurrent = existing.id === currentId;
    if (isCurrent && !wantsCurrent) return fail(400, 'Make another version Current instead — one version must always be Current.');
    const changes = { ...fields, ...(file || {}) };
    const next = { ...existing, ...changes };
    await svc.PolicyVersion.update(existing.id, changes);
    if (isCurrent && (file || existing.display_title !== fields.display_title)) {
      // The served document changes: refresh the served copy, undoing the version edit if that fails.
      try { await promote(svc, next); } catch (e) {
        await svc.PolicyVersion.update(existing.id, {
          file_uri: existing.file_uri, file_name: existing.file_name, content_sections: existing.content_sections || [], display_title: existing.display_title || '',
        }).catch(() => null);
        throw e;
      }
    } else if (wantsCurrent && !isCurrent) {
      await promote(svc, next);
    }
    return Response.json({ ok: true, version_id: existing.id, ...(await reconcile(svc, policyId)) });
  }

  if (!file) return fail(400, 'Please upload the document for this version.');
  const key = typeof body.request_key === 'string' ? body.request_key : '';
  if (!key) return fail(400, 'request_key is required.');

  // Retry-safe: the same request reuses its candidate instead of creating another version.
  const found = await svc.PolicyVersion.filter({ policy_id: policyId, request_key: key }, { limit: 1 });
  let candidate = found.items?.[0];
  if (!candidate) {
    candidate = await svc.PolicyVersion.create({ ...fields, ...file, policy_id: policyId, status: 'Superseded', pending: true, origin: 'upload', request_key: key });
  } else if (candidate.pending) {
    await svc.PolicyVersion.update(candidate.id, { ...fields, ...file });
  }
  const verified = await svc.PolicyVersion.get(candidate.id);
  if (!verified?.file_uri) throw new Error('The uploaded document could not be confirmed');

  if (wantsCurrent) {
    if (verified.id !== currentId) await promote(svc, verified);
  } else if (verified.pending) {
    await svc.PolicyVersion.update(verified.id, { pending: false });
  }
  return Response.json({ ok: true, version_id: verified.id, ...(await reconcile(svc, policyId)) });
}

export default async function handler(req: Request): Promise<Response> {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me().catch((e: any) => (e.status === 401 ? null : Promise.reject(e)));
    if (!user) return fail(401, 'Please sign in again.');
    const body = await req.json().catch(() => ({}));
    const policyId = typeof body?.policy_id === 'string' ? body.policy_id : '';
    if (!policyId) return fail(400, 'policy_id is required.');

    const svc = base44.asServiceRole.entities;
    const doc = await svc.PolicyDocument.get(policyId).catch(ignore404);
    if (!doc) return fail(404, 'This policy no longer exists.');

    if (body.action === 'list') {
      const { versions, current, repairs } = await reconcile(svc, policyId);
      return Response.json({ ok: true, versions, current_version_id: current?.id || null, repairs });
    }
    if (body.action === 'save') return await save(svc, policyId, body);
    if (body.action === 'delete') {
      const { current, versions } = await reconcile(svc, policyId);
      const target = versions.find((v: any) => v.id === body.version_id);
      if (!target) return fail(404, 'This version no longer exists.');
      if (target.id === current?.id) return fail(400, 'This document must be superseded before it can be deleted.');
      await svc.PolicyVersion.delete(target.id).catch(ignore404);
      return Response.json({ ok: true });
    }
    return fail(400, 'Unknown action.');
  } catch (error) {
    console.error('policyVersions failed:', error?.message || error);
    return fail(500, `${error?.message || 'Unexpected error'}. The Current version was not changed, so you can try again.`);
  }
}

serve(handler);
