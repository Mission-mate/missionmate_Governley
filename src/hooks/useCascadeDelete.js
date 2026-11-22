import { useState } from 'react';

const failureMessage = (noun, count) => {
  const subject = count > 1 ? `${count} ${noun}s` : `this ${noun}`;
  const still = count > 1 ? `those ${noun}s are` : `the ${noun} is`;
  return `We couldn't finish deleting ${subject}. Some related records may already have been removed, but ${still} still here. Try again to safely continue the cleanup.`;
};

/**
 * Runs a server-side cascade delete and tracks a retryable failure message.
 * `run(ids)` resolves to { failed: [{ id }] }. confirm() resolves to the ids that
 * were NOT deleted (empty on full success) so callers keep them selected for retry.
 */
export default function useCascadeDelete(run, noun) {
  const [error, setError] = useState('');

  const confirm = async (ids) => {
    setError('');
    let failedIds;
    try {
      const result = await run(ids);
      failedIds = (result?.failed || []).map((f) => f.id);
    } catch {
      failedIds = ids;
    }
    if (failedIds.length) setError(failureMessage(noun, failedIds.length));
    return failedIds;
  };

  return { error, confirm, clearError: () => setError('') };
}