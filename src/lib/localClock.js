/**
 * Device-local application clock.
 *
 * Every "today", overdue, due-soon, expiry and review comparison in the app
 * uses the viewer's own device calendar day. Records store date-only values as
 * 'yyyy-MM-dd', so comparisons are plain string/calendar-day comparisons —
 * never route a date-only value or "today" through UTC (`toISOString`), which
 * shifts the day for any non-zero offset.
 */

const pad = (n) => String(n).padStart(2, '0');

/** A Date's device-local calendar day as 'yyyy-MM-dd'. */
export function toLocalISODate(date) {
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;
}

/** The device's current calendar day as 'yyyy-MM-dd'. */
export function localToday() {
  return toLocalISODate(new Date());
}

/** The current moment (device-local fields), for date-fns calendar arithmetic. */
export function localNow() {
  return new Date();
}