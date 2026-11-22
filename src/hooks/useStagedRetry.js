import { useState } from 'react';

/** Failed retries after which "Refresh page" is offered alongside "Try again". */
const RETRIES_BEFORE_REFRESH = 3;

/**
 * Staged recovery for read-error cards: "Try again" first, then "Refresh page"
 * once retrying keeps failing. Counts retries that failed while the card stayed
 * on screen; a successful retry unmounts the card, so the count starts fresh.
 * Returns { retry, retrying, onRefresh } — onRefresh is undefined until offered.
 */
export default function useStagedRetry(refetch) {
  const [failedRetries, setFailedRetries] = useState(0);
  const [retrying, setRetrying] = useState(false);
  const retry = async () => {
    setRetrying(true);
    try {
      await refetch();
    } finally {
      setRetrying(false);
      setFailedRetries((n) => n + 1);
    }
  };
  return {
    retry,
    retrying,
    onRefresh: failedRetries >= RETRIES_BEFORE_REFRESH ? () => window.location.reload() : undefined,
  };
}