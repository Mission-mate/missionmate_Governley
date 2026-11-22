import React from 'react';
import { Calendar } from 'lucide-react';
import { cn } from '@/lib/utils';
import { overdueLabel } from '@/lib/overdueLabel';
import { format, parseISO, isValid } from 'date-fns';
import { CustomCellDisplay } from '@/components/strategy/level6/report/ReportCellEditor';
import OptionLabel, { isDottedColumn } from '@/components/shared/OptionLabel';
import InitialsAvatar from '../../InitialsAvatar';
import ProgressCell from '@/components/shared/ProgressCell';

/** Read-only cell for the Level 5 task table — handles built-in and custom columns. */
export default function TaskCellDisplay({ column, task }) {
  if (column.kind === 'custom') {
    return <CustomCellDisplay column={column} value={task.custom_values?.[column.id]} />;
  }
  const value = task[column.key];
  if (column.type === 'Progress') {
    return <ProgressCell value={Number(value) || 0} />;
  }
  if (value === null || value === undefined || value === '') {
    return <span className="text-[13px] text-muted-foreground">—</span>;
  }
  if (column.type === 'Date') {
    try {
      const d = parseISO(value);
      if (isValid(d)) {
        const done = task.completed || task.status === 'Completed' || task.status === 'Cancelled';
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const overdue = column.key === 'due_date' && !done && d < today;
        if (overdue) {
          return (
            <span className="inline-flex flex-col leading-tight text-red-600 dark:text-red-400">
              <span className="text-[13px] font-medium">{format(d, 'd MMM yyyy')}</span>
              <span className="text-[11px]">{overdueLabel(value)}</span>
            </span>);
        }
        return (
          <span className="inline-flex items-center gap-1.5 text-[13px] text-[hsl(var(--sidebar-foreground))]">
             {format(d, 'd MMM yyyy')}
          </span>);

      }
    } catch {/* fall through */}
    return <span className="text-[13px] text-muted-foreground">—</span>;
  }
  if (column.type === 'People') return <InitialsAvatar name={value} className="[&>span:last-child]:text-[13px]" />;
  if (column.type === 'Single Select') {
    const opt = (column.options || []).find((o) => o.name === value);
    return <OptionLabel name={String(value)} color={opt?.color} dotted={isDottedColumn(column)} />;
  }
  return <span className="text-[13px] text-foreground">{String(value)}</span>;
}