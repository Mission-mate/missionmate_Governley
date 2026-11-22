import { differenceInCalendarDays, parseISO, isValid } from 'date-fns';

/** Days a non-completed task is past its due date (0 when not overdue). */
export function overdueDays(dueIso, done) {
  if (done || !dueIso) return 0;
  const d = parseISO(dueIso);
  if (!isValid(d)) return 0;
  return Math.max(0, differenceInCalendarDays(new Date(), d));
}

export const daysAgoLabel = (n) => `${n} day${n === 1 ? '' : 's'} ago`;