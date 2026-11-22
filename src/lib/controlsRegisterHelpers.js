import { differenceInCalendarDays, parseISO } from 'date-fns';
import { localNow } from '@/lib/localClock';

/** Parse a date string (or Date) safely; returns null on failure. */
function toDate(dateStr) {
  if (!dateStr) return null;
  try {
    return typeof dateStr === 'string' ? parseISO(dateStr) : dateStr;
  } catch {
    return null;
  }
}

/** Days remaining until the date. Positive = remaining, negative = overdue. */
export function daysRemaining(dateStr) {
  const d = toDate(dateStr);
  if (!d) return null;
  return differenceInCalendarDays(d, localNow());
}

/** True when the parent risk's next review date is in the past. */
export function isControlReviewOverdue(control) {
  const days = daysRemaining(control.next_review_date);
  return days !== null && days < 0;
}

/**
 * Flatten every Risk's existing_controls into a single list of control rows.
 * Each row carries the parent risk reference and review/status metadata.
 */
export function flattenControls(risks = []) {
  const rows = [];
  risks.forEach((risk) => {
    (risk.existing_controls || []).forEach((control) => {
      rows.push({
        ...control,
        _key: `${risk.id}::${control.id}`,
        risk_id: risk.id,
        risk_title: risk.title,
        category: risk.category,
        owner: risk.owner,
        risk_residual_rating: risk.residual_rating,
        risk_status: risk.status || 'Active',
        risk_appetite: risk.risk_appetite,
        last_reviewed_date: risk.last_reviewed_date,
        next_review_date: risk.next_review_date,
      });
    });
  });
  return rows;
}