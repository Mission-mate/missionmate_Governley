import React from 'react';
import { cn } from '@/lib/utils';
import { statusConfig } from '@/lib/meetingParticipants';

/** Read-only attendance status pill; attendance is changed on the Manage Attendance step. */
export default function AttendanceStatusBadge({ status }) {
  const cfg = statusConfig(status);
  return (
    <span className={cn('px-2.5 py-1 rounded-full text-xs font-semibold shrink-0', cfg.bg, cfg.color)}>
      {cfg.label}
    </span>
  );
}