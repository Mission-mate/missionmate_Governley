import React from 'react';
import { format, isSameMonth } from 'date-fns';
import { monthWeeks, iso } from './calendarPeriods';
import { cn } from '@/lib/utils';

const DOW = ['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'];

/**
 * Day grid for a single month. Click one day to select it, click a second day
 * to select the range between them, a third click starts a new selection.
 */
export default function CalendarMonthGrid({ month, selection, onSelectDay, dueCounts }) {
  const weeks = monthWeeks(month);
  const inSel = (d) => selection && iso(d) >= iso(selection.start) && iso(d) <= iso(selection.end);
  const isEdge = (d) => selection && (iso(d) === iso(selection.start) || iso(d) === iso(selection.end));

  return (
    <div className="grid grid-cols-7 gap-y-1">
      {DOW.map((d) => (
        <div key={d} className="text-center text-xs font-medium text-muted-foreground pb-1">{d}</div>
      ))}
      {weeks.flat().map((d) => {
        const outside = !isSameMonth(d, month);
        const selected = inSel(d);
        const edge = isEdge(d);
        const count = dueCounts?.[iso(d)] || 0;
        return (
          <button
            key={iso(d)}
            onClick={() => onSelectDay(d)}
            className="relative h-9 w-full flex items-center justify-center"
          >
            <span
              className={cn(
                'w-8 h-8 flex items-center justify-center text-sm rounded-full transition-colors',
                outside ? 'text-muted-foreground/40' : 'text-foreground',
                edge
                  ? 'bg-primary text-primary-foreground font-semibold'
                  : selected
                    ? 'bg-primary/10 text-primary font-medium'
                    : 'hover:bg-muted'
              )}
            >
              {format(d, 'd')}
            </span>
            {count > 0 && !edge && (
              <span className="absolute bottom-0.5 left-1/2 -translate-x-1/2 w-1 h-1 rounded-full bg-primary" />
            )}
          </button>
        );
      })}
    </div>
  );
}