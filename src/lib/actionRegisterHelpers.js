import { differenceInCalendarDays, parseISO } from 'date-fns';
import { localNow } from '@/lib/localClock';

// Statuses that close out an action (no longer "in flight").
const CLOSED_STATUSES = ['Completed'];

/** Parse a date string (or Date) safely; returns null on failure. */
function toDate(dateStr) {
  if (!dateStr) return null;
  try {
    return typeof dateStr === 'string' ? parseISO(dateStr) : dateStr;
  } catch {
    return null;
  }
}

/** Days remaining until due date. Positive = remaining, negative = overdue. */
export function daysRemaining(dueDate) {
  const d = toDate(dueDate);
  if (!d) return null;
  return differenceInCalendarDays(d, localNow());
}

/** True when the action is overdue: has a due date in the past and is not closed. */
export function isActionOverdue(action) {
  if (CLOSED_STATUSES.includes(action.status)) return false;
  const days = daysRemaining(action.due_date);
  return days !== null && days < 0;
}

/**
 * Flatten every Risk's treatment_plan into a single list of action rows.
 * Each row carries the parent risk reference for the "Related Risk" link.
 */
export function flattenActions(risks = []) {
  const rows = [];
  risks.forEach((risk) => {
    (risk.treatment_plan || []).forEach((action) => {
      rows.push({
        ...action,
        _key: `${risk.id}::${action.id}`,
        risk_id: risk.id,
        risk_title: risk.title,
        risk_residual_rating: risk.residual_rating,
        risk_treatment_strategy: risk.treatment_action,
      });
    });
  });
  return rows;
}

/** Summary card counts across all flattened actions. */
export function actionSummaryCounts(actions = []) {
  const total = actions.length;
  const overdue = actions.filter(isActionOverdue).length;
  const highPriority = actions.filter((a) => a.priority === 'High').length;
  const dueIn30 = actions.filter((a) => {
    if (CLOSED_STATUSES.includes(a.status)) return false;
    const days = daysRemaining(a.due_date);
    return days !== null && days >= 0 && days <= 30;
  }).length;
  const closed = actions.filter((a) => CLOSED_STATUSES.includes(a.status)).length;
  const completionPct = total > 0 ? Math.round((closed / total) * 100) : 0;
  return { total, overdue, highPriority, dueIn30, closed, completionPct };
}