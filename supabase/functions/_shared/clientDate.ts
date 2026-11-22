/**
 * Device-local reference date supplied by the client.
 *
 * Date-driven reports ("as at today", overdue, days overdue) are computed
 * against the requesting user's own device calendar day, which the client
 * sends as `today: 'yyyy-MM-dd'`. The server never assumes its own (UTC) or the
 * organisation's timezone for these comparisons.
 *
 * A device day can only be within one calendar day of UTC (offsets span
 * UTC-12..UTC+14), so anything further away is rejected as invalid.
 */

const ISO_DAY = /^\d{4}-\d{2}-\d{2}$/;
const DAY_MS = 86400000;

/** Returns the validated 'yyyy-MM-dd' reference date, or null when missing/invalid. */
export function readClientToday(body: any): string | null {
  const raw = body?.today;
  if (typeof raw !== 'string' || !ISO_DAY.test(raw)) return null;
  const ts = Date.parse(`${raw}T00:00:00Z`);
  if (Number.isNaN(ts) || new Date(ts).toISOString().slice(0, 10) !== raw) return null;
  const utcToday = Date.parse(`${new Date().toISOString().slice(0, 10)}T00:00:00Z`);
  return Math.abs(ts - utcToday) <= DAY_MS ? raw : null;
}

export const INVALID_TODAY = () =>
  Response.json({ error: 'A valid device date (today, yyyy-MM-dd) is required.' }, { status: 400 });