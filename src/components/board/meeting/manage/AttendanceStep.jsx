import React, { useState } from 'react';
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select';
import { ATTENDANCE_STATUSES, updateParticipantStatus } from '@/lib/meetingParticipants';
import { LoaderOne } from '@/components/ui/loaders';
import AttendanceStatusBadge from '../AttendanceStatusBadge';
import { toast } from '@/components/ui/use-toast';

function initials(name = '') {
  return name.split(' ').filter(Boolean).slice(0, 2).map(p => p[0]?.toUpperCase()).join('');
}

export default function AttendanceStep({ participants, refresh }) {
  const [updatingId, setUpdatingId] = useState(null);

  // A failed update must never look like it stuck: we toast the reason and let
  // refresh() pull the row back to its last-persisted status.
  const handleStatus = async (participant, status) => {
    setUpdatingId(participant.id);
    try {
      await updateParticipantStatus(participant.id, status);
      await refresh();
    } catch (err) {
      toast({
        variant: 'destructive',
        title: 'Could not update status',
        description: err?.message || 'Please try again.',
      });
      await refresh().catch(() => {});
    } finally {
      setUpdatingId(null);
    }
  };

  if (participants.length === 0) {
    return <p className="text-sm text-muted-foreground text-center py-8">No attendees yet. Add people in the first step.</p>;
  }

  return (
    <div className="space-y-2">
      {participants.map(p => (
        <div key={p.id} className="flex items-center gap-3 border border-border rounded-xl px-4 py-3">
          <div className="w-9 h-9 rounded-full bg-primary/10 text-primary flex items-center justify-center text-xs font-semibold shrink-0">
            {initials(p.member_name) || '?'}
          </div>
          <div className="flex-1 min-w-0">
            <p className="font-semibold text-sm text-foreground truncate">{p.member_name}</p>
            <p className="text-xs text-muted-foreground truncate">{p.position || p.member_email}</p>
          </div>
          <Select
            value={p.status || 'invited'}
            onValueChange={(s) => handleStatus(p, s)}
            disabled={updatingId === p.id}
          >
            <SelectTrigger className="w-36 h-9 shrink-0">
              {updatingId === p.id ? <LoaderOne size="sm" /> : <SelectValue />}
            </SelectTrigger>
            <SelectContent>
              {ATTENDANCE_STATUSES.map(s => (
                <SelectItem key={s.value} value={s.value}><AttendanceStatusBadge status={s.value} /></SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      ))}
    </div>
  );
}