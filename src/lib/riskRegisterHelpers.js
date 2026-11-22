import { differenceInCalendarDays, parseISO } from 'date-fns';
import { formatReviewDate } from '@/lib/reviewDateUtils';
import { localNow } from '@/lib/localClock';

export { formatReviewDate };

// Statuses that count as an "open" treatment action.
const OPEN_ACTION_STATUSES = ['Not Started', 'In Progress', 'On Hold'];

/** Count of open treatment actions (Not Started / In Progress / On Hold). */
export function openActionsCount(risk) {
  const plan = risk?.treatment_plan || [];
  return plan.filter((a) => OPEN_ACTION_STATUSES.includes(a.status)).length;
}

/** True when a date string is strictly before today. */
export function isOverdueDate(dateStr) {
  if (!dateStr) return false;
  try {
    const target = typeof dateStr === 'string' ? parseISO(dateStr) : dateStr;
    return differenceInCalendarDays(target, localNow()) < 0;
  } catch {
    return false;
  }
}

/** True when the risk's next review date is in the past and the risk is not closed. */
export function isReviewOverdue(risk) {
  if (risk?.status === 'Closed') return false;
  return isOverdueDate(risk?.next_review_date);
}

/** A risk has an overdue treatment when any open action's due date has passed. */
export function hasOverdueTreatment(risk) {
  const plan = risk?.treatment_plan || [];
  return plan.some(
    (a) => OPEN_ACTION_STATUSES.includes(a.status) && a.due_date && isOverdueDate(a.due_date)
  );
}

/** Final residual rating (falls back to inherent when residual is unset). */
export function residualRating(risk) {
  return risk?.residual_rating || '';
}

/** Summary card counts across the full risk set. */
export function summaryCounts(risks = []) {
  return {
    total: risks.length,
    critical: risks.filter((r) => residualRating(r) === 'Very High').length,
    high: risks.filter((r) => residualRating(r) === 'High').length,
    dueForReview: risks.filter((r) => isReviewOverdue(r)).length,
    overdueTreatments: risks.filter((r) => hasOverdueTreatment(r)).length,
  };
}