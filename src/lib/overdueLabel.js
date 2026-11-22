import { localToday } from '@/lib/localClock';

const DAY_MS = 86400000;
const toUtc = (iso) => Date.UTC(+iso.slice(0, 4), +iso.slice(5, 7) - 1, +iso.slice(8, 10));

/** "5 days overdue" — whole calendar days a date is past the organisation's today. */
export function overdueLabel(isoDate) {
  const days = isoDate ? Math.max(1, Math.round((toUtc(localToday()) - toUtc(String(isoDate))) / DAY_MS)) : 1;
  return `${days} ${days === 1 ? 'day' : 'days'} overdue`;
}