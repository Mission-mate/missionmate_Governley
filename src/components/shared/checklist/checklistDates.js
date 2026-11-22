import { format, parseISO, isValid, differenceInCalendarDays } from 'date-fns';
import { localToday } from '@/lib/localClock';

/** "6 Nov" due label; open overdue items get a "· N days ago" suffix (org's today). */
export function dueLabel(date, done = false) {
  if (!date) return '';
  const d = parseISO(date);
  if (!isValid(d)) return '';
  const label = format(d, 'd MMM');
  const n = differenceInCalendarDays(parseISO(localToday()), d);
  if (done || n <= 0) return label;
  return `${label} · ${n === 1 ? 'yesterday' : `${n} days ago`}`;
}