import React from 'react';
import { format, parseISO } from 'date-fns';

/**
 * Calendar-style date badge: red header band with the month, a bold day
 * number, and a muted year underneath — resembling a torn calendar page.
 */
export default function CalendarDateTile({ dateStr }) {
  let mon = '', day = '', year = '';
  try {
    const d = parseISO(dateStr);
    mon = format(d, 'MMM').toUpperCase();
    day = format(d, 'd');
    year = format(d, 'yyyy');
  } catch { /* ignore */ }

  return (
    <div className="w-14 rounded-lg overflow-hidden shrink-0 bg-white border border-border shadow-sm">
      <div className="bg-red-500 text-white text-[10px] font-bold tracking-wide text-center py-0.5">
        {mon}
      </div>
      <div className="flex flex-col items-center justify-center py-1">
        <span className="text-xl font-bold text-foreground leading-none">{day}</span>
        <span className="text-[10px] text-muted-foreground mt-0.5">{year}</span>
      </div>
    </div>
  );
}