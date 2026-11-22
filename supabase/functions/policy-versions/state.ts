/**
 * Policy version state. The platform has no transactions, so "exactly one Current
 * version" is anchored on ONE field: PolicyDocument.current_version_id.
 *
 *  - Promotion commits with a single PolicyDocument update that sets the pointer and
 *    the served file together, so Preview and the pointer can never disagree.
 *  - Version `status` values are derived from the pointer and repaired on every read.
 *  - New uploads are written as hidden `pending` candidates first; a failure before the
 *    commit leaves the old Current version and Preview untouched, and a retry with the
 *    same request_key reuses the candidate instead of creating a duplicate.
 *  - The first version of a legacy policy is seeded idempotently: concurrent seeds all
 *    keep the oldest one and delete the rest, so every caller converges on the same record.
 */

const PAGE = 500;
const ABANDONED_MS = 24 * 60 * 60 * 1000;

export const oldestFirst = (a: any, b: any) => (a.created_date || '').localeCompare(b.created_date || '') || a.id.localeCompare(b.id);
const ignore404 = (e: any) => (e?.status === 404 || e?.response?.status === 404 ? null : Promise.reject(e));

export async function allVersions(svc: any, policyId: string): Promise<any[]> {
  const rows: any[] = [];
  let cursor: string | undefined;
  do {
    const page = await svc.PolicyVersion.filter({ policy_id: policyId }, { sort: 'created_date', limit: PAGE, ...(cursor ? { cursor } : {}) });
    rows.push(...(page.items || []));
    cursor = page.has_more ? page.next_cursor : undefined;
  } while (cursor);
  return rows;
}

/** Fields that make `v` the version served by Preview and the assistant. */
export const servedFields = (v: any) => ({
  current_version_id: v.id, primary_file_uri: v.file_uri || '', primary_file_name: v.file_name || '',
  primary_display_title: v.display_title || '', content_sections: v.content_sections || [],
});

const seedsFor = (rows: any[], doc: any) => rows.filter((r) => r.origin === 'seed' && r.file_uri === doc.primary_file_uri).sort(oldestFirst);

/** Creates the first version from the policy's primary file; duplicates from concurrent opens are removed. */
async function seedFirstVersion(svc: any, doc: any, repairs: string[]) {
  await svc.PolicyVersion.create({
    policy_id: doc.id, origin: 'seed', pending: false, version_number: '1.0', status: 'Superseded',
    approved_by: doc.approved_by || '', approved_date: doc.approved_date || null, effective_from: doc.effective_date || null,
    file_uri: doc.primary_file_uri, file_name: doc.primary_file_name || '', display_title: doc.primary_display_title || '',
    content_sections: doc.content_sections || [],
  });
  const rows = await allVersions(svc, doc.id);
  const extras = seedsFor(rows, doc).slice(1);
  for (const r of extras) await svc.PolicyVersion.delete(r.id).catch(ignore404);
  if (extras.length) repairs.push(`removed ${extras.length} duplicate first version(s)`);
  return rows.filter((r) => !extras.includes(r));
}


/** Picks the Current version for a policy with no valid pointer, without changing the served file. */
function pickCanonical(doc: any, rows: any[]) {
  const newest = [...rows].sort(oldestFirst).reverse();
  const serving = newest.filter((r) => r.file_uri && r.file_uri === doc.primary_file_uri);
  if (serving.length) return serving.find((r) => r.status === 'Current') || serving[serving.length - 1];
  if (doc.primary_file_uri) return null; // needs a seeded version for the served file
  return newest.find((r) => r.status === 'Current') || newest[0] || null;
}

/**
 * Brings a policy's versions into a consistent state and returns them (newest first)
 * with the confirmed Current version. Safe to run concurrently and repeatedly.
 */
export async function reconcile(svc: any, policyId: string) {
  const repairs: string[] = [];
  let doc = await svc.PolicyDocument.get(policyId);
  let rows = await allVersions(svc, policyId);

  // Abandoned upload candidates (never committed) are cleared after a day.
  const now = Date.now();
  const stale = rows.filter((r) => r.pending && r.id !== doc.current_version_id && now - Date.parse(r.created_date) > ABANDONED_MS);
  for (const r of stale) await svc.PolicyVersion.delete(r.id).catch(ignore404);
  rows = rows.filter((r) => !stale.includes(r));

  // Concurrent first opens can each seed a first version: every caller keeps the oldest.
  const extraSeeds = seedsFor(rows, doc).slice(1);
  for (const r of extraSeeds) await svc.PolicyVersion.delete(r.id).catch(ignore404);
  if (extraSeeds.length) repairs.push(`removed ${extraSeeds.length} duplicate first version(s)`);
  rows = rows.filter((r) => !extraSeeds.includes(r));

  let current = rows.find((r) => r.id === doc.current_version_id) || null;
  if (!current) {
    current = pickCanonical(doc, rows.filter((r) => !r.pending));
    if (!current && doc.primary_file_uri) {
      rows = await seedFirstVersion(svc, doc, repairs);
      current = seedsFor(rows, doc)[0] || null;
    }
    if (current) {
      const keepsServedFile = current.file_uri === doc.primary_file_uri;
      doc = await svc.PolicyDocument.update(doc.id, keepsServedFile ? { current_version_id: current.id } : servedFields(current));
      repairs.push('set the Current version pointer');
    }
  } else if (current.file_uri !== doc.primary_file_uri) {
    // Never silently swap the served file — report it for follow-up.
    repairs.push('served file differs from the Current version file');
  }

  // Derive every visible version's status from the pointer.
  const fixes: [any, Record<string, unknown>][] = [];
  for (const r of rows) {
    const isCurrent = !!current && r.id === current.id;
    if (r.pending && !isCurrent) continue;
    const status = isCurrent ? 'Current' : 'Superseded';
    const want = { ...(r.pending ? { pending: false } : {}), ...(r.status !== status ? { status } : {}) };
    if (Object.keys(want).length) fixes.push([r, want]);
  }
  for (const [r, want] of fixes) {
    await svc.PolicyVersion.update(r.id, want);
    Object.assign(r, want);
  }
  if (fixes.length) repairs.push(`corrected ${fixes.length} version status(es)`);
  if (repairs.length) console.warn(`policyVersions reconcile ${policyId}:`, repairs.join('; '));

  const versions = rows.filter((r) => !r.pending).sort(oldestFirst).reverse();
  return { doc, versions, current, repairs };
}