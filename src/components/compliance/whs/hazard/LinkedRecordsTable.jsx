import React from 'react';
import { cn } from '@/lib/utils';
import { overdueLabel } from '@/lib/overdueLabel';
import CircleCheck from '@/components/shared/CircleCheck';
import { STATUS_PILL } from '@/lib/whsTabs';
import { initialsOf as initials } from '@/lib/initials';
import { formatDisplayDate } from './whsDate';
import { localToday } from '@/lib/localClock';

const TH = 'text-left px-4 py-3 text-xs font-semibold text-foreground/80 uppercase tracking-wide';

function Cell({ col, row }) {
  const v = row[col.key];
  if (col.kind === 'title') {
    return (
      <div className="min-w-0">
        <p className="font-semibold text-primary truncate" title={v || ''}>{v || '—'}</p>
        {col.sub && row[col.sub] && <p className="text-xs text-muted-foreground mt-0.5 truncate" title={row[col.sub]}>{row[col.sub]}</p>}
      </div>
    );
  }
  if (!v) return <span className="text-muted-foreground">–</span>;
  if (col.kind === 'pill') return <span className={cn('px-2.5 py-1 rounded-full text-xs font-medium whitespace-nowrap', STATUS_PILL[v] || 'bg-muted text-muted-foreground')}>{v}</span>;
  if (col.kind === 'date') {
    const overdue = col.overdue && row.status !== 'Closed' && v < localToday();
    return (
      <span className={cn('whitespace-nowrap', overdue ? 'text-destructive font-semibold' : 'font-medium text-foreground')}>
        {formatDisplayDate(v)}
        {overdue && <span className="block text-xs font-normal text-destructive">{overdueLabel(v)}</span>}
      </span>
    );
  }
  if (col.kind === 'person') {
    return (
      <div className="flex items-center gap-2 min-w-0">
        <span className="w-7 h-7 rounded-full bg-primary/10 text-primary text-xs font-bold flex items-center justify-center shrink-0">{initials(v)}</span>
        <span className="text-foreground truncate">{v}</span>
      </div>
    );
  }
  return <span className="text-foreground">{v}</span>;
}

/** Reporting-Obligations-style table for records linked to a WHS source. */
export default function LinkedRecordsTable({ columns, rows, selected, onToggleOne, onOpen }) {
  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm table-fixed">
        <colgroup>
          <col className="w-12" />
          {columns.map((c) => <col key={c.key} style={{ width: c.width }} />)}
        </colgroup>
        <thead>
          <tr className="bg-secondary/40 border-b border-border">
            <th className="px-4 py-3" />
            {columns.map((c) => <th key={c.key} className={TH}>{c.label}</th>)}
          </tr>
        </thead>
        <tbody>
          {rows.map((r) => {
            const isSel = selected.includes(r.id);
            return (
              <tr key={r.id} onClick={() => onOpen(r)}
                className={cn('border-b border-border last:border-0 hover:bg-sidebar-accent/70 transition-colors cursor-pointer', isSel && 'bg-primary/5 hover:bg-primary/5')}>
                <td className="px-4 py-4" onClick={(e) => e.stopPropagation()}>
                  <CircleCheck checked={isSel} onChange={() => onToggleOne(r.id)} />
                </td>
                {columns.map((c) => <td key={c.key} className="px-4 py-4"><Cell col={c} row={r} /></td>)}
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}