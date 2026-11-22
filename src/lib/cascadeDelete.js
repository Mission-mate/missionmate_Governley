import { base44 } from '@/api/base44Client';

/**
 * Delete every record of an entity matching a specific query, in one batched call.
 *
 * Replaces the old "fetch children, then delete one-by-one" pattern: a single
 * server-side deleteMany is far fewer round trips and far fewer failure points
 * than a loop that can break part-way through. It is not transactional — the
 * platform exposes no database transactions — but it is retry-safe, because
 * re-running it simply matches nothing for rows already removed.
 *
 * The query MUST be specific — an empty or blank-valued query is rejected so a
 * cascade can never widen into "delete everything".
 */
export async function deleteAllWhere(entityName, query) {
  const keys = Object.keys(query || {});
  if (keys.length === 0) {
    throw new Error(`Refusing to delete ${entityName} records without a specific query.`);
  }
  const hasBlank = keys.some((k) => query[k] === undefined || query[k] === null || query[k] === '');
  if (hasBlank) {
    throw new Error(`Refusing to delete ${entityName} records — query contains an empty value.`);
  }
  return base44.entities[entityName].deleteMany(query);
}

/**
 * Run identified async operations in parallel, letting every one finish, and
 * report outcomes with their identity preserved so a caller can map each
 * failure back to the exact record it belongs to.
 *
 * @param {{id: string, promise: Promise}[]} entries
 * @returns {{succeeded: {id: string, value: any}[], failed: {id: string, reason: any}[]}}
 */
export async function settleAll(entries) {
  const list = entries || [];
  const results = await Promise.allSettled(list.map((e) => e.promise));
  const succeeded = [];
  const failed = [];
  results.forEach((r, i) => {
    const id = list[i].id;
    if (r.status === 'fulfilled') succeeded.push({ id, value: r.value });
    else failed.push({ id, reason: r.reason });
  });
  return { succeeded, failed };
}

/**
 * Run delete promises in parallel and surface a single aggregated error if any
 * of them failed. Unlike Promise.all this always lets every delete finish, so a
 * failure part-way through a batch does not silently abandon the remainder.
 *
 * @param {Promise[]} promises
 * @param {string} label  plural noun used in the error message, e.g. 'work items'
 * @returns {number} the number of successful deletes
 */
export async function settleAllDeletes(promises, label = 'records') {
  const results = await Promise.allSettled(promises);
  const failed = results.filter((r) => r.status === 'rejected');
  if (failed.length > 0) {
    const detail = failed[0].reason?.message ? ` ${failed[0].reason.message}` : '';
    throw new Error(
      `${failed.length} of ${results.length} ${label} could not be deleted.${detail}`
    );
  }
  return results.length;
}