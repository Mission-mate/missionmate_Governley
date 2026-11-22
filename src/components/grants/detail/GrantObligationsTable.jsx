import React from 'react';
import { format, parseISO, isPast, isToday } from 'date-fns';
import { cn } from '@/lib/utils';
import { overdueLabel } from '@/lib/overdueLabel';
import CircleCheck from '@/components/shared/CircleCheck';
import GroupedTableBlock from '@/components/shared/table/GroupedTableBlock';

const STATUS_STYLES = {
  not_started: 'bg-gray-100 text-gray-600 border border-gray-200',
  in_progress: 'bg-yellow-50 text-yellow-700 border border-yellow-200',
  complete: 'bg-green-50 text-green-700 border border-green-200',
};

const STATUS_LABELS = {
  not_started: 'Not Started',
  in_progress: 'In Progress',
  complete: 'Completed',
};

const displayStatus = (s) => s || 'not_started';

function fmtDate(d) {
  if (!d) return '–';
  try { return format(parseISO(d), 'dd MMM yyyy'); } catch { return d; }
}

function initials(name) {
  if (!name) return '?';
  return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
}

function isOverdue(ob) {
  if (!ob.due_date || ob.status === 'complete') return false;
  try {
    const due = parseISO(ob.due_date);
    return isPast(due) && !isToday(due);
  } catch { return false; }
}

/**
 * `obligations` is always the full row set. Pass `groups` ([{ key, items }]) to
 * render every group inside this ONE table with separator rows, so all groups
 * share the same column grid.
 */
export default function GrantObligationsTable({ obligations, groups, selected, onToggleOne, onOpen, emptyText = 'No obligations in this category.' }) {
  if (obligations.length === 0) {
    return <div className="py-16 text-center text-sm text-muted-foreground">{emptyText}</div>;
  }

  const renderRow = (ob) => {
    const overdue = isOverdue(ob);
    const isSelected = selected.includes(ob.id);
    return (
      <tr
        key={ob.id}
        onClick={() => onOpen(ob)}
        className={cn('border-b border-border last:border-0 cursor-pointer transition-colors', isSelected ? 'bg-primary/10' : 'hover:bg-sidebar-accent/70')}
      >
        <td className="px-4 py-4" onClick={(e) => e.stopPropagation()}>
          <CircleCheck checked={isSelected} onChange={() => onToggleOne(ob.id)} />
        </td>
        <td className="px-4 py-4">
          <span className="font-semibold text-foreground">{ob.title}</span>
          {ob.reporting_type && <p className="text-xs text-muted-foreground mt-0.5">{ob.reporting_type}</p>}
        </td>
        <td className="px-4 py-4">
          <p className={cn('font-medium', overdue ? 'text-red-600' : 'text-foreground')}>{fmtDate(ob.due_date)}</p>
          {overdue && <p className="text-xs text-red-500 mt-0.5">{overdueLabel(ob.due_date)}</p>}
        </td>
        <td className="px-4 py-4">
          {ob.responsible_person ? (
            <div className="flex items-center gap-2">
              <div className="w-7 h-7 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                <span className="text-primary text-xs font-bold">{initials(ob.responsible_person)}</span>
              </div>
              <span className="text-foreground text-sm">{ob.responsible_person}</span>
            </div>
          ) : (
            <span className="text-muted-foreground">–</span>
          )}
        </td>
        <td className="px-4 py-4">
          <span className={cn('px-2.5 py-1 rounded-full text-xs font-medium', STATUS_STYLES[displayStatus(ob.status)] || STATUS_STYLES.not_started)}>
            {STATUS_LABELS[displayStatus(ob.status)] || ob.status}
          </span>
        </td>
      </tr>
    );
  };

  const renderTable = (rows, grouped = false) => (
    <table className={cn('w-full text-sm', grouped && 'table-fixed')}>
      {grouped && <colgroup>{['5%', '32%', '18%', '27%', '18%'].map((width, index) => <col key={index} style={{ width }} />)}</colgroup>}
      <thead>
        <tr className="bg-secondary/40 border-b border-border">
          <th className={cn('px-4 py-3', !grouped && 'w-10')} />
          <th className="text-left px-4 py-3 text-xs font-semibold text-foreground/80 uppercase tracking-wide">Obligation</th>
          <th className="text-left px-4 py-3 text-xs font-semibold text-foreground/80 uppercase tracking-wide">Due Date</th>
          <th className="text-left px-4 py-3 text-xs font-semibold text-foreground/80 uppercase tracking-wide">Responsible Person</th>
          <th className="text-left px-4 py-3 text-xs font-semibold text-foreground/80 uppercase tracking-wide">Status</th>
        </tr>
      </thead>
      <tbody>{rows.map(renderRow)}</tbody>
    </table>
  );

  return groups ? (
    <div className="space-y-4">
      {groups.map((g) => <GroupedTableBlock key={g.key} label={g.key} count={g.items.length}>{renderTable(g.items, true)}</GroupedTableBlock>)}
    </div>
  ) : (
    <div className="overflow-x-auto">{renderTable(obligations)}</div>
  );
}