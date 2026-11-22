import React from 'react';
import { format, parseISO } from 'date-fns';
import { Calendar } from 'lucide-react';
import { formatTime12, MEETING_TYPES } from '@/lib/boardMeetings';
import SectionEditButton from '@/components/shared/SectionEditButton';
import { ELEVATED_CARD } from '@/components/shared/cardStyles';

function Field({ label, value }) {
  return (
    <div>
      <p className="text-xs text-muted-foreground mb-0.5">{label}</p>
      <p className="text-sm font-semibold text-foreground">{value || '—'}</p>
    </div>
  );
}

export default function MeetingDetailsCard({ meeting, onEdit }) {
  let dateStr = '';
  try { dateStr = meeting.meeting_date ? format(parseISO(meeting.meeting_date), 'd MMMM yyyy') : ''; } catch { /* ignore */ }
  const timeStr = meeting.start_time
    ? `${formatTime12(meeting.start_time)}${meeting.end_time ? ` - ${formatTime12(meeting.end_time)}` : ''}`
    : '';
  const typeLabel = MEETING_TYPES.find(t => t.key === meeting.meeting_type)?.label || '';

  return (
    <div className={`${ELEVATED_CARD} p-6`}>
      <div className="flex items-center justify-between mb-5">
        <div className="flex items-center gap-2">
          <Calendar className="w-5 h-5 text-primary" />
          <h2 className="text-lg font-bold text-foreground">Meeting Details</h2>
        </div>
        <SectionEditButton onClick={onEdit} />
      </div>

      <div className="space-y-4">
        <div className="grid grid-cols-2 gap-4">
          <Field label="Date" value={dateStr} />
          <Field label="Time" value={timeStr} />
        </div>
        <Field label="Location" value={meeting.location} />
        <Field label="Meeting Committee" value={meeting.committee_name} />
        <Field label="Meeting Type" value={typeLabel} />
      </div>
    </div>
  );
}