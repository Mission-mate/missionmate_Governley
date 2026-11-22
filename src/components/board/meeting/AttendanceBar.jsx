import React from 'react';
import { cn } from '@/lib/utils';
import { ATTENDANCE_STATUSES } from '@/lib/meetingParticipants';

/** Proportional attendance bar with the count of each status in one row beneath it. */
export default function AttendanceBar({ attendees }) {
  const stats = ATTENDANCE_STATUSES.map(s => ({
    ...s,
    count: attendees.filter(a => (a.status || 'invited') === s.value).length,
  }));

  return (
    <div>
      <div className="flex gap-0.5 h-2 rounded-full overflow-hidden">
        {stats.filter(s => s.count > 0).map(s => (
          <div
            key={s.value}
            title={`${s.count} ${s.label}`}
            style={{ flexGrow: s.count }}
            className={cn('basis-0 min-w-1.5 transition-[flex-grow] duration-300 ease-out motion-reduce:transition-none', s.dot)}
          />
        ))}
      </div>
      <div className="mt-2.5 flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-muted-foreground">
        {stats.map(s => (
          <span key={s.value} className="flex items-center gap-1.5 whitespace-nowrap">
            <span className={cn('w-2 h-2 rounded-full', s.dot)} />
            {s.count} {s.label}
          </span>
        ))}
      </div>
    </div>
  );
}