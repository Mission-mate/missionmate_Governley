import { differenceInCalendarDays, parseISO, format, addMonths, addYears } from 'date-fns';
import { localNow } from '@/lib/localClock';

/**
 * Shared review-scheduling helpers used across Risk, Conflict of Interest,
 * Board People and Action Register exports.
 */

export const REVIEW_FREQUENCIES = [
  'Monthly',
  'Quarterly',
  'Biannually',
  'Annually',
  'Every',
  'Ad Hoc',
];

/**
 * Calculate the next review date from a base date and the chosen frequency.
 * Returns a 'yyyy-MM-dd' string, or null when no date can be derived (Ad Hoc / unset).
 */
export function calcNextReviewDate(frequency, { baseDate = localNow(), intervalValue, intervalUnit } = {}) {
  const base = typeof baseDate === 'string' ? parseISO(baseDate) : baseDate;
  let result;
  switch (frequency) {
    case 'Monthly': result = addMonths(base, 1); break;
    case 'Quarterly': result = addMonths(base, 3); break;
    case 'Biannually': result = addMonths(base, 6); break;
    case 'Annually': result = addYears(base, 1); break;
    case 'Every': {
      const n = Number(intervalValue) || 0;
      if (n <= 0) return null;
      result = intervalUnit === 'Years' ? addYears(base, n) : addMonths(base, n);
      break;
    }
    default: return null; // Ad Hoc or unset — no auto date
  }
  return format(result, 'yyyy-MM-dd');
}

/** Whole-day difference between next review date and today. Negative = overdue. */
export function daysRemaining(nextReviewDate) {
  if (!nextReviewDate) return null;
  try {
    const target = typeof nextReviewDate === 'string' ? parseISO(nextReviewDate) : nextReviewDate;
    return differenceInCalendarDays(target, localNow());
  } catch {
    return null;
  }
}

export function formatReviewDate(d) {
  if (!d) return '—';
  try {
    return format(typeof d === 'string' ? parseISO(d) : d, 'd MMM yyyy');
  } catch {
    return d;
  }
}