import React from 'react';
import { format, parseISO } from 'date-fns';
import { cn } from '@/lib/utils';
import RowSelectCircle from '@/components/strategy/selection/RowSelectCircle';
import { badgeTone } from '@/lib/statusBadge';
import ErrorBoundary from '@/components/shared/states/ErrorBoundary';
import ErrorRowFallback from '@/components/shared/states/ErrorRowFallback';

/** Column count of the rendered table — keeps the error row exactly as wide as a normal row. */
const PEOPLE_COLUMN_COUNT = 5;

function initials(name = '') {
  return name.split(' ').filter(Boolean).slice(0, 2).map((p) => p[0]?.toUpperCase()).join('');
}

function formatExpiry(d) {
  if (!d) return '—';
  try { return format(parseISO(d), 'dd MMM yyyy'); } catch { return d; }
}

function isOverdue(person) {
  if (person.appointment_term !== 'Custom' || !person.term_renewal_date) return false;
  try { return parseISO(person.term_renewal_date) < new Date(); } catch { return false; }
}

export default function PeopleTable({ people = [], onView, selectedId, onToggleSelect }) {
  return (
    <div className="border border-border rounded-xl overflow-hidden bg-card">
      <table className="w-full">
        <thead>
          <tr className="bg-secondary/40 border-b border-border">
            <th className="text-left px-4 py-2.5 text-xs font-semibold text-foreground/80 uppercase tracking-wide">Committee Member</th>
            <th className="text-left px-4 py-2.5 text-xs font-semibold text-foreground/80 uppercase tracking-wide">Position</th>
            <th className="text-left px-4 py-2.5 text-xs font-semibold text-foreground/80 uppercase tracking-wide">Date Commenced</th>
            <th className="text-left px-4 py-2.5 text-xs font-semibold text-foreground/80 uppercase tracking-wide">Term Expiry</th>
            <th className="text-left px-4 py-2.5 text-xs font-semibold text-foreground/80 uppercase tracking-wide">Status</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-border">
          {people.map((person) => {
            const isInactive = person.status === 'inactive';
            return (
              <ErrorBoundary
                key={person.id}
                resetKey={person.id}
                fallback={({ retry }) => (
                  <ErrorRowFallback colSpan={PEOPLE_COLUMN_COUNT} onRetry={retry} />
                )}>
              <tr
                key={person.id}
                onClick={() => onView(person)}
                className={cn('cursor-pointer transition-colors', selectedId === person.id ? 'bg-primary/5' : 'hover:bg-sidebar-accent/70')}>
                <td className="px-4 py-3">
                  <div className="flex items-center gap-3 min-w-0">
                    <RowSelectCircle checked={selectedId === person.id} onChange={() => onToggleSelect(person)} />
                    <div className="w-9 h-9 rounded-full bg-primary/10 text-primary flex items-center justify-center text-xs font-semibold shrink-0">
                      {initials(person.member_name) || '?'}
                    </div>
                    <div className="min-w-0">
                      <p className="text-sm font-medium text-foreground truncate">{person.member_name}</p>
                      <p className="text-xs text-muted-foreground truncate">{person.member_email}</p>
                    </div>
                  </div>
                </td>
                <td className="px-4 py-3 text-sm text-muted-foreground">{person.position || 'Member'}</td>
                <td className="px-4 py-3 text-sm text-muted-foreground">{formatExpiry(person.appointment_date)}</td>
                <td className={cn(
                  'px-4 py-3 text-sm',
                  isOverdue(person) ? 'text-destructive font-medium' : 'text-foreground'
                )}>
                  {person.appointment_term === 'Custom' ? formatExpiry(person.term_renewal_date) : 'Ongoing'}
                </td>
                <td className="px-4 py-3">
                  <span className={cn(
                    'inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium',
                    isInactive ? 'bg-muted text-muted-foreground' : badgeTone('green')
                  )}>
                    {isInactive ? 'Inactive' : 'Active'}
                  </span>
                </td>
              </tr>
              </ErrorBoundary>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}