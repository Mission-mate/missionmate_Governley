import { formatDate } from '@/lib/meetingActionApi';

// Decisions Register vocabulary shared by the form, table, toolbar and exports.
export const DECISION_TYPES = [
  { value: 'Decision', hint: 'Agreed by consensus, or noted' },
  { value: 'Resolution', hint: 'A formal motion, moved and voted on' },
];

export const OUTCOME_OPTIONS = [
  { name: 'Agreed', color: 'blue' },
  { name: 'Approved', color: 'green' },
  { name: 'Endorsed', color: 'purple' },
  { name: 'Noted', color: 'gray' },
  { name: 'Declined', color: 'red' },
];

/** Answers to "Replaces an earlier decision?" */
export const DISPOSITION_OPTIONS = [{ name: 'No' }, { name: 'Supersedes' }, { name: 'Rescinds' }];

export const STATUS_OPTIONS = [
  { name: 'Current', color: 'green' },
  { name: 'Superseded', color: 'orange' },
  { name: 'Rescinded', color: 'red' },
];

const STATUS_BY_DISPOSITION = { Supersedes: 'Superseded', Rescinds: 'Rescinded' };

/** A decision's status, and so its tab, always follows its disposition. */
export const decisionStatus = (decision) => STATUS_BY_DISPOSITION[decision.disposition] || 'Current';

/** Fields the toolbar can group and filter by. */
export const DECISION_FACETS = [
  { id: 'decision_type', label: 'Decision Type', config: { options: DECISION_TYPES.map((t) => ({ name: t.value })) } },
  { id: 'outcome', label: 'Outcome', config: { options: OUTCOME_OPTIONS } },
];

/** One-line meeting summary shown under a decision's title in the table and PDF. */
export function decisionMeta(decision) {
  return [
    decision.meeting_name,
    decision.meeting_date && formatDate(decision.meeting_date),
    decision.agenda_item && `Agenda Item ${decision.agenda_item}`,
  ].filter(Boolean).join(' · ');
}