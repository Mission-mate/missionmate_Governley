/**
 * Shared read-failure helpers used by every module.
 *
 * A "load failure" is a read that failed with nothing loaded to show. A failed
 * background refresh is NOT one: the loaded content stays on screen and the
 * query client raises a toast instead (see lib/query-client).
 */

const statusOf = (err) => err?.status ?? err?.response?.status;

/**
 * Run a single-record read. A record that doesn't exist resolves to null (a genuine
 * "not found"); any other failure throws, so an outage never looks like a missing record.
 */
export async function getOrNull(read) {
  try {
    return (await read()) ?? null;
  } catch (err) {
    if (statusOf(err) === 404) return null;
    throw err;
  }
}

/**
 * Combine reads (query results, or other load failures) into one failure:
 * failed when any of them failed with no data, and retrying only the ones that failed.
 */
export function loadFailure(...reads) {
  const failed = reads.filter((r) => r?.isLoadingError);
  return {
    isLoadingError: failed.length > 0,
    isFetching: failed.some((r) => r.isFetching),
    refetch: () => Promise.all(failed.map((r) => r.refetch())),
  };
}