import {
  startOfMonth, endOfMonth, startOfQuarter, endOfQuarter, startOfYear, endOfYear,
  addMonths, addQuarters, startOfWeek, endOfWeek, format, isSameDay,
} from 'date-fns';

export const iso = (d) => format(d, 'yyyy-MM-dd');

/** Financial year (1 July – 30 June) containing the given date. */
export function financialYearRange(anchor) {
  const y = anchor.getMonth() >= 6 ? anchor.getFullYear() : anchor.getFullYear() - 1;
  return { start: new Date(y, 6, 1), end: endOfMonth(new Date(y + 1, 5, 1)) };
}

export function getPeriodRange(mode, anchor) {
  if (mode === 'quarter') return { start: startOfQuarter(anchor), end: endOfQuarter(anchor) };
  if (mode === 'year') return financialYearRange(anchor);
  return { start: startOfMonth(anchor), end: endOfMonth(anchor) };
}

export function shiftAnchor(mode, anchor, dir) {
  if (mode === 'quarter') return addQuarters(anchor, dir);
  if (mode === 'year') return anchor;
  return addMonths(anchor, dir);
}

export function periodLabel(mode, anchor) {
  const { start, end } = getPeriodRange(mode, anchor);
  if (mode === 'month') return format(start, 'MMMM yyyy');
  if (mode === 'year') return `${format(start, 'MMMM yyyy')} – ${format(end, 'MMMM yyyy')}`;
  return `${format(start, 'MMM yyyy')} – ${format(end, 'MMM yyyy')}`;
}

/** Compact label: FY 26-27 / Q1 26-27 / Jul 26-27 (FY = financial year of the anchor). */
export function shortPeriodLabel(mode, anchor) {
  const { start } = financialYearRange(anchor);
  const fy = `${format(start, 'yy')}-${format(new Date(start.getFullYear() + 1, 0, 1), 'yy')}`;
  if (mode === 'year') return `FY ${fy}`;
  if (mode === 'month') return format(anchor, 'MMM yy');
  // Financial-year quarters: Jul–Sep = Q1
  const q = Math.floor((((anchor.getMonth() - 6) + 12) % 12) / 3) + 1;
  return `Q${q} ${fy}`;
}

export function monthsInPeriod(mode, anchor) {
  const { start } = getPeriodRange(mode, anchor);
  const count = mode === 'month' ? 1 : mode === 'quarter' ? 3 : 12;
  return Array.from({ length: count }, (_, i) => addMonths(start, i));
}

// Grid of week rows (each 7 days) covering the given month
export function monthWeeks(month) {
  const first = startOfWeek(startOfMonth(month), { weekStartsOn: 0 });
  const last = endOfWeek(endOfMonth(month), { weekStartsOn: 0 });
  const weeks = [];
  let cursor = first;
  while (cursor <= last) {
    const days = Array.from({ length: 7 }, (_, i) => new Date(cursor.getTime() + i * 86400000));
    weeks.push(days);
    cursor = new Date(cursor.getTime() + 7 * 86400000);
  }
  return weeks;
}

export const sameDay = isSameDay;