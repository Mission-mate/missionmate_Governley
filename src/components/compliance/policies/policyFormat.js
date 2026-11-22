import { daysRemaining } from '@/lib/complianceRegisters';

export function frequencyLabel(doc) {
  if (doc.review_with_parent) return 'With parent';
  if (doc.review_frequency === 'Every') {
    const n = doc.interval_value || 0;
    const unit = (doc.interval_unit || 'Months').toLowerCase();
    return `Every ${n} ${n === 1 ? unit.slice(0, -1) : unit}`;
  }
  return doc.review_frequency || '—';
}

/** Overdue note for the next review date, or null. */
export function overdueNote(doc) {
  if (doc.status === 'archived') return null;
  const days = daysRemaining(doc.next_review_date);
  if (days === null || days >= 0) return null;
  return `${-days} day${days === -1 ? '' : 's'} overdue`;
}