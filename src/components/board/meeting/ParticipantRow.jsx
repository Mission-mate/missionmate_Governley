import React from 'react';
import { X } from 'lucide-react';
import AttendanceStatusBadge from './AttendanceStatusBadge';

function initials(name = '') {
  return name.split(' ').filter(Boolean).slice(0, 2).map(p => p[0]?.toUpperCase()).join('');
}

/** An attendee in the Manage Attendees pane: read-only attendance status and a remove control. */
export default function ParticipantRow({ participant, onRemove }) {
  return (
    <div className="flex items-center gap-3 border border-border rounded-xl px-4 py-3">
      <div className="w-9 h-9 rounded-full bg-primary/10 text-primary flex items-center justify-center text-xs font-semibold shrink-0">
        {initials(participant.member_name) || '?'}
      </div>
      <div className="flex-1 min-w-0">
        <p className="font-semibold text-sm text-foreground truncate">{participant.member_name}</p>
        <p className="text-xs text-muted-foreground truncate">{participant.position || participant.member_email}</p>
      </div>
      <AttendanceStatusBadge status={participant.status} />
      <button onClick={() => onRemove(participant)} title="Remove" className="text-muted-foreground hover:text-destructive transition-colors shrink-0">
        <X className="w-4 h-4" />
      </button>
    </div>
  );
}