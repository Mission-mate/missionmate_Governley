import React from 'react';
import RowSelectCircle from '@/components/strategy/selection/RowSelectCircle';
import AttendanceRateBar from './AttendanceRateBar';
import { initialsOf } from '@/lib/initials';
import { cn } from '@/lib/utils';

const HEAD = 'text-left px-4 py-2.5 text-xs font-semibold text-foreground/80 uppercase tracking-wide';

export default function AttendanceTable({ rows, goodThreshold = 75, atRiskThreshold = 50, onView, selectedId, onSelect }) {
  if (rows.length === 0) {
    return (
      <div className="border border-dashed border-border rounded-xl py-10 text-center text-muted-foreground text-sm">
        No attendance records in this period.
      </div>);

  }

  return (
    <div className="border border-border rounded-xl overflow-hidden bg-card">
      <div>
        <table className="w-full table-fixed">
          <thead>
            <tr className="bg-secondary/40 border-b border-border">
              <th className={cn(HEAD, 'w-[27%]')}>Member</th>
              <th className={cn(HEAD, 'w-[20%]')}>Position</th>
              <th className={cn(HEAD, 'w-[15%] whitespace-nowrap')}>Meetings Attended</th>
              <th className={cn(HEAD, 'w-[10%]')}>Apologies</th>
              <th className={cn(HEAD, 'w-[10%]')}>Absences</th>
              <th className={cn(HEAD, 'w-[18%] whitespace-nowrap')}>Attendance Rate</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {rows.map((r, i) => {
              const selected = selectedId === r.id;
              return (
                <tr
                  key={r.id}
                  onClick={() => onView?.(r)}
                  className={cn('cursor-pointer transition-colors', selected ? 'bg-primary/5' : 'hover:bg-sidebar-accent/70')}>

                  <td className="px-4 py-3">
                    <div className="flex items-center gap-3 min-w-0">
                      <span onClick={(e) => e.stopPropagation()} className="flex">
                        <RowSelectCircle checked={selected} onChange={() => onSelect?.(selected ? null : r.id)} />
                      </span>
                      <div className="w-9 h-9 rounded-full bg-primary/10 text-primary flex items-center justify-center text-xs font-semibold shrink-0">
                        {initialsOf(r.member_name) || '?'}
                      </div>
                      <p className="text-sm font-medium text-foreground truncate">{r.member_name}</p>
                    </div>
                  </td>
                  <td className="px-4 py-3 text-sm text-muted-foreground">{r.position || 'Member'}</td>
                  <td className="px-4 py-3 text-sm text-foreground">{r.present}/{r.total}</td>
                  <td className="px-4 py-3 text-sm font-medium text-amber-600 dark:text-amber-400">{r.apology}</td>
                  <td className="px-4 py-3 text-sm font-medium text-destructive">{r.absent}</td>
                  <td className="px-4 py-3">
                    <AttendanceRateBar index={i} rate={r.rate} goodThreshold={goodThreshold} atRiskThreshold={atRiskThreshold} />
                  </td>
                </tr>);

            })}
          </tbody>
        </table>
      </div>
    </div>);

}