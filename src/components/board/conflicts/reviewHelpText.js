// Tooltip help text for the Conflict of Interest review date fields,
// shared by the view, edit and add panes.
export const LAST_REVIEW_HELP = 'Updated manually by an admin';
export const NEXT_REVIEW_HELP = 'Auto-calculated based on Review Frequency & Last Review Date';

// Guide text shown under the Review row, driven by the selected frequency.
export function reviewGuideText(frequency) {
  if (frequency === 'Not Required') return 'This COI is saved without review dates.';
  if (frequency === 'Ad Hoc') return 'Ad Hoc — no next review date is scheduled.';
  return 'Next Review Date is auto-calculated based on ‘Review Frequency’ and ‘Last Review Date’.';
}