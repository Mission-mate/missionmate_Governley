import { parseISO, isPast, isToday } from 'date-fns';

/**
 * Single source of truth for the "Overdue" display flag on a ReportingObligation.
 *
 * Overdue is NEVER a stored status — it is computed from the due date and the
 * lifecycle status, so the on-screen table, PDF and Excel exports cannot diverge.
 * Completed obligations are never overdue, and reverting a completed obligation
 * back to not_started/in_progress makes it overdue again automatically.
 */
export function isObligationOverdue(ob) {
  if (!ob?.due_date || ob.status === 'complete') return false;
  try {
    const d = parseISO(ob.due_date);
    return isPast(d) && !isToday(d);
  } catch {
    return false;
  }
}