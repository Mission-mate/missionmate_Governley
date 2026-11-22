// Best-effort in-memory sliding-window rate limiter.
//
// Scope: per function instance. It resets on redeploy and is not shared across
// scaled instances — acceptable as a supplementary brake on abusive clients.
// Deliberately NOT database-backed: throttle state in the DB would itself be a
// write-amplification vector on an unauthenticated endpoint.

const hits = new Map<string, number[]>();

// Drop keys that have gone quiet so the map can't grow without bound.
function evictStale(now: number, windowMs: number) {
  for (const [key, stamps] of hits) {
    if (stamps.length === 0 || now - stamps[stamps.length - 1] > windowMs) {
      hits.delete(key);
    }
  }
}

/**
 * Records an attempt for `key` and reports whether it is within the allowance.
 * @param key Identifier to throttle on (e.g. a client IP).
 * @param opts max = attempts permitted per window, windowMs = window length.
 */
export function checkRateLimit(
  key: string,
  { max, windowMs }: { max: number; windowMs: number },
): { allowed: boolean } {
  const now = Date.now();

  // Opportunistic cleanup — cheap at the traffic levels this endpoint sees.
  if (hits.size > 500) evictStale(now, windowMs);

  const recent = (hits.get(key) || []).filter((t) => now - t < windowMs);

  if (recent.length >= max) {
    hits.set(key, recent);
    return { allowed: false };
  }

  recent.push(now);
  hits.set(key, recent);
  return { allowed: true };
}