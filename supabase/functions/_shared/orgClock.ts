/**
 * Organisation clock — the Time Zone field of the Organisation Profile
 * (`org_profile` AppConfig record). Falls back to UTC when unset.
 *
 * NOT used for user-facing "today" / overdue / due-soon comparisons: those use
 * the viewer's device day (frontend `@/lib/localClock`; reports receive it as
 * `today` via `shared/clientDate.ts`).
 *
 * Documented org-time exceptions (no requesting device exists, or the value is
 * a timezone/timestamp presentation, not a current-day comparison):
 * - processMembershipExpiry: nightly scheduled sweep (expiry + reminder dates).
 * - createMeetingCalendarEvent / generateSubmissionPDF: event/timestamp timezone.
 * - generateStrategyStatusReport: "Generated …" timestamp label.
 */

const CONFIG_KEY = 'org_profile';

/** Pull the IANA zone out of 'GMT+09:30 Australia/Darwin (ACST)'. */
export function parseOrgTimezone(raw) {
  if (!raw || typeof raw !== 'string') return 'UTC';
  const match = raw.match(/([A-Za-z_]+\/[A-Za-z_\-+0-9]+)/);
  const zone = match ? match[1] : raw.trim();
  try {
    new Intl.DateTimeFormat('en-CA', { timeZone: zone });
    return zone;
  } catch {
    return 'UTC';
  }
}

/** Read the organisation's configured timezone. Always resolves (UTC on failure). */
export async function getOrgTimezone(base44) {
  try {
    const records = await base44.asServiceRole.entities.AppConfig.filter({ key: CONFIG_KEY });
    return parseOrgTimezone(records?.[0]?.settings?.timezone);
  } catch {
    return 'UTC';
  }
}

/** Current calendar date in `timezone` as 'yyyy-MM-dd'. */
export function todayIn(timezone) {
  // en-CA formats as yyyy-mm-dd.
  return new Intl.DateTimeFormat('en-CA', {
    timeZone: timezone,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).format(new Date());
}

/** Human-readable date+time stamp in `timezone`, for 'Generated ...' lines. */
export function nowLabelIn(timezone, locale = 'en-AU') {
  return new Intl.DateTimeFormat(locale, {
    timeZone: timezone,
    dateStyle: 'medium',
    timeStyle: 'short',
  }).format(new Date());
}

/**
 * One call for every date-based function: resolves the org timezone and the
 * reference date derived from it.
 */
export async function orgClock(base44) {
  const timezone = await getOrgTimezone(base44);
  return {
    timezone,
    today: todayIn(timezone),
    nowIso: new Date().toISOString(),
    nowLabel: nowLabelIn(timezone),
  };
}