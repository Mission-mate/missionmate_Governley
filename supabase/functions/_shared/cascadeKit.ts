/**
 * Building blocks for server-side cascades (Strategy, Program, Project).
 *
 * The platform has no database transactions, so a cascade is made safe by:
 *  - reading ids page by page (no fixed record ceiling),
 *  - deleting through scoped deleteMany calls in bounded id chunks,
 *  - re-counting until nothing matches (verification), and
 *  - retrying transient failures with backoff.
 * Every step is idempotent, so a failed run can simply be repeated.
 */

const CHUNK = 100;
const PAGE = 500;
const ATTEMPTS = 4;
const MAX_ROUNDS = 10;

export class CascadeError extends Error {
  stage: string;
  constructor(stage: string, cause: any) {
    super(`Could not remove ${stage}: ${cause?.message || cause}`);
    this.stage = stage;
  }
}

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

/** Client errors (other than rate limits) won't succeed on retry. */
const isRetryable = (e: any) => {
  const status = e?.status ?? e?.response?.status;
  return !status || status === 429 || status >= 500;
};

export async function withRetry<T>(stage: string, op: () => Promise<T>): Promise<T> {
  let lastError: any;
  for (let attempt = 0; attempt < ATTEMPTS; attempt++) {
    try {
      return await op();
    } catch (e) {
      lastError = e;
      if (!isRetryable(e) || attempt === ATTEMPTS - 1) break;
      await sleep(400 * 2 ** attempt);
    }
  }
  throw new CascadeError(stage, lastError);
}

export const chunks = (ids: string[]) => {
  const out: string[][] = [];
  for (let i = 0; i < ids.length; i += CHUNK) out.push(ids.slice(i, i + CHUNK));
  return out;
};

/** All record ids matching a query, read page by page. */
export async function collectIds(entity: any, query: Record<string, unknown>): Promise<string[]> {
  const ids: string[] = [];
  let cursor: string | undefined;
  do {
    const page = await entity.filter(query, { limit: PAGE, ...(cursor ? { cursor } : {}) });
    (page.items || []).forEach((r: any) => ids.push(r.id));
    cursor = page.has_more ? page.next_cursor : undefined;
  } while (cursor);
  return ids;
}

/** Delete every match, repeating until a count confirms nothing remains. Returns the number removed. */
export async function purge(svc: any, name: string, query: Record<string, unknown>): Promise<number> {
  return withRetry(name, async () => {
    const entity = svc[name];
    const before = await entity.count(query);
    let remaining = before;
    for (let round = 0; remaining > 0 && round < MAX_ROUNDS; round++) {
      await entity.deleteMany(query);
      remaining = await entity.count(query);
    }
    if (remaining > 0) throw new Error(`${remaining} ${name} record(s) remain`);
    return before;
  });
}

/**
 * Cascade every record matching `query` (in id chunks) until none remain, so rows
 * created while the cascade runs are removed too. Throws if any are left.
 */
export async function drain(svc: any, name: string, query: Record<string, unknown>, cascade: (ids: string[]) => Promise<void>) {
  for (let round = 0; round < MAX_ROUNDS; round++) {
    const ids = await withRetry(name, () => collectIds(svc[name], query));
    if (!ids.length) return;
    for (const ids100 of chunks(ids)) await cascade(ids100);
  }
  const left = await withRetry(name, () => svc[name].count(query));
  if (left > 0) throw new CascadeError(name, new Error(`${left} record(s) remain`));
}

/** Delete one parent record last; already-gone counts as done so retries stay idempotent. */
export async function deleteParent(svc: any, name: string, id: string) {
  await withRetry(name, () => svc[name].delete(id).catch((e: any) => (e?.status === 404 ? null : Promise.reject(e))));
}

export type Tally = Record<string, number>;
export const add = (tally: Tally, name: string, n: number) => { tally[name] = (tally[name] || 0) + n; };

const RECORD_ID = /^[a-f0-9]{24}$/i;

/** Normalise a caller-supplied id list: well-formed record ids only, trimmed, unique. */
export function cleanIds(value: unknown): string[] {
  if (!Array.isArray(value)) return [];
  return [...new Set(value.filter((v) => typeof v === 'string').map((v) => v.trim()).filter((v) => RECORD_ID.test(v)))];
}

const ATTACHED = ['NotePage', 'Document', 'DocumentFolder'];

/** Notes / documents / folders attached to the given records by object_type + object_id. */
export async function purgeAttached(svc: any, tally: Tally, objectType: string, ids: string[], names = ATTACHED) {
  for (const c of chunks(ids)) {
    const q = { object_type: objectType, object_id: { $in: c } };
    for (const name of names) add(tally, name, await purge(svc, name, q));
  }
}

type Failure = { id: string; title: string; stage: string | null; error: string };

/**
 * Run a cascade per parent, one at a time, so one failure never blocks the rest.
 * Failed parents are left in place for a safe retry.
 */
export async function runEach(records: any[], cascade: (id: string, tally: Tally) => Promise<Tally>) {
  const deleted: string[] = [];
  const failed: Failure[] = [];
  const removed: Tally = {};
  for (const r of records) {
    try {
      await cascade(r.id, removed);
      deleted.push(r.id);
    } catch (e) {
      console.error(`Cascade failed for ${r.id}:`, e?.message || e);
      failed.push({ id: r.id, title: r.title || '', stage: e instanceof CascadeError ? e.stage : null, error: e?.message || String(e) });
    }
  }
  return { ok: failed.length === 0, deleted, failed, removed };
}