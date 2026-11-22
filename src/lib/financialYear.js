// Compliance period helpers — Financial Year (1 Jul – 30 Jun) and Calendar Year (1 Jan – 31 Dec).

export const FY_MIN_START = 2025; // earliest selectable start year
export const FY_MAX_START = 2050; // latest selectable start year

export const PERIOD_FINANCIAL = 'Financial Year';
export const PERIOD_CALENDAR = 'Calendar Year';

const isCalendar = (type) => type === PERIOD_CALENDAR;

/**
 * Returns the FY start year (the year in which 1 July falls) for a given date.
 * e.g. 2026-07-25 → 2026 ; 2026-03-01 → 2025
 */
function currentFinancialYearStart(date = new Date()) {
  // July (month index 6) onwards belongs to the FY starting this year
  return date.getMonth() >= 6 ? date.getFullYear() : date.getFullYear() - 1;
}

/** Current start year for the given period type. */
export function currentPeriodStart(type, date = new Date()) {
  return isCalendar(type) ? date.getFullYear() : currentFinancialYearStart(date);
}

/** Clamp a start year to the selectable range. */
export function clampStartYear(startYear) {
  return Math.min(FY_MAX_START, Math.max(FY_MIN_START, startYear));
}

/** ISO start date (1 July for FY, 1 January for CY). */
export function periodStartDate(type, startYear) {
  return isCalendar(type) ? `${startYear}-01-01` : `${startYear}-07-01`;
}

/** ISO end date (30 June of the next year for FY, 31 December for CY). */
export function periodEndDate(type, startYear) {
  return isCalendar(type) ? `${startYear}-12-31` : `${startYear + 1}-06-30`;
}

/** Human label, e.g. "1 July 2025 - 30 June 2026" or "1 January 2026 - 31 December 2026". */
export function formatPeriod(type, startYear) {
  return isCalendar(type)
    ? `1 January ${startYear} - 31 December ${startYear}`
    : `1 July ${startYear} - 30 June ${startYear + 1}`;
}

/** Derive the period start year from a stored ISO start date (works for 1 Jul and 1 Jan anchors). */
export function startYearFromDate(isoDate) {
  if (!isoDate) return null;
  const y = parseInt(String(isoDate).slice(0, 4), 10);
  return Number.isNaN(y) ? null : y;
}