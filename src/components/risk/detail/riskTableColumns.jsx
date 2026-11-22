import React from 'react';
import { cn } from '@/lib/utils';
import PersonInitialsAvatar from '@/components/shared/PersonInitialsAvatar';
import { formatReviewDate } from '@/lib/reviewDateUtils';
import { EFFECTIVENESS_STYLES } from './controlConstants';
import { STATUS_STYLES } from '@/components/risk/steps/treatmentConstants';
import { OUTCOME_STYLES } from '@/components/risk/review/reviewConstants';

const Pill = ({ value, styles }) => value
  ? <span className={cn('px-2.5 py-1 rounded-full text-xs font-medium whitespace-nowrap', styles[value] || 'bg-muted text-muted-foreground')}>{value}</span>
  : <span className="text-muted-foreground">–</span>;

const Title = ({ value, fallback }) => <span title={value || fallback} className="block truncate font-semibold text-foreground">{value || fallback}</span>;

const Owner = ({ name }) => name
  ? <span title={name}><PersonInitialsAvatar name={name} className="h-8 w-8" /></span>
  : <span className="text-muted-foreground">–</span>;

export const CONTROL_COLUMNS = [
  { label: 'Control Title', width: 'w-1/2', cellClass: 'max-w-0', render: (c) => <Title value={c.control} fallback="Untitled control" /> },
  { label: 'Design Effectiveness', width: 'w-1/4', render: (c) => <Pill value={c.design_effectiveness} styles={EFFECTIVENESS_STYLES} /> },
  { label: 'Operating Effectiveness', width: 'w-1/4', render: (c) => <Pill value={c.operating_effectiveness} styles={EFFECTIVENESS_STYLES} /> },
];

export const REVIEW_COLUMNS = [
  { label: 'Review Title', cellClass: 'max-w-0 w-full', render: (r) => <Title value={r.title} fallback="Untitled review" /> },
  { label: 'Reviewer', width: 'w-24', render: (r) => <Owner name={r.reviewer} /> },
  { label: 'Review Date', render: (r) => <span className="text-foreground whitespace-nowrap">{r.date ? formatReviewDate(r.date) : '–'}</span> },
  { label: 'Review Outcome', render: (r) => <Pill value={r.outcome} styles={OUTCOME_STYLES} /> },
];

const resolveBy = (a) => (a.resolve_by === 'Due Date' && a.due_date ? formatReviewDate(a.due_date) : a.resolve_by || '–');

export const TREATMENT_COLUMNS = [
  { label: 'Treatment Title', cellClass: 'max-w-0 w-full', render: (a) => <Title value={a.title} fallback="Untitled action" /> },
  { label: 'Owner', width: 'w-20', render: (a) => <Owner name={a.owner} /> },
  { label: 'Resolve By', render: (a) => <span className="text-foreground whitespace-nowrap">{resolveBy(a)}</span> },
  { label: 'Status', render: (a) => <Pill value={a.status} styles={STATUS_STYLES} /> },
  { label: 'Progress', render: (a) => <span className="font-medium text-foreground">{a.progress || 0}%</span> },
];