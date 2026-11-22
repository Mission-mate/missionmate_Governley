// Quarter/Month grouping + filtering helpers for the Compliance Calendar.
// Quarters and month ordering respect the register's Reporting Year:
// Financial Year — Q1 = Jul–Sep, months run July → June.
// Calendar Year  — Q1 = Jan–Mar, months run January → December.

const MONTH_NAMES = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December',
];

export const QUARTER_LABELS = ['Q1', 'Q2', 'Q3', 'Q4'];

export const isCalendarYear = (periodType) => periodType === 'Calendar Year';

/** Month names ordered by the period type (FY: July first, CY: January first). */
export function orderedMonths(periodType) {
  if (isCalendarYear(periodType)) return MONTH_NAMES;
  return [...MONTH_NAMES.slice(6), ...MONTH_NAMES.slice(0, 6)];
}

/** Quarter label ('Q1'–'Q4') for an ISO date, per the period type. Null when no date. */
export function quarterOf(isoDate, periodType) {
  if (!isoDate) return null;
  const m = parseInt(isoDate.slice(5, 7), 10) - 1;
  if (Number.isNaN(m) || m < 0 || m > 11) return null;
  const shifted = isCalendarYear(periodType) ? m : (m - 6 + 12) % 12;
  return `Q${Math.floor(shifted / 3) + 1}`;
}

/** Quarter label ('Q1'–'Q4') for a month NAME, per the period type. Null when unknown. */
export function quarterOfMonthName(monthName, periodType) {
  const idx = monthIndexOf(monthName, periodType);
  if (idx === -1) return null;
  return `Q${Math.floor(idx / 3) + 1}`;
}

/** 0-based index of a month name within the period's month order. -1 when unknown. */
export function monthIndexOf(monthName, periodType) {
  if (!monthName) return -1;
  return orderedMonths(periodType).indexOf(monthName);
}

/** Full month name for an ISO date. Null when no date. */
export function monthNameOf(isoDate) {
  if (!isoDate) return null;
  const m = parseInt(isoDate.slice(5, 7), 10) - 1;
  if (Number.isNaN(m) || m < 0 || m > 11) return null;
  return MONTH_NAMES[m];
}