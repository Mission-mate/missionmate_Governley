import React from 'react';
import { ELEVATED_ROW, LIFT_BUTTON } from '@/components/shared/cardStyles';
import { Clock, MapPin, ExternalLink, Pencil, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { formatTime12 } from '@/lib/boardMeetings';
import CalendarDateTile from '@/components/board/CalendarDateTile';

const ACTION_BUTTON = `${LIFT_BUTTON} h-8 px-3 text-xs font-medium`;

export default function MeetingRow({ meeting, onOpen, onEdit, onDelete }) {
  return (
    <div className={`${ELEVATED_ROW} px-5 py-3 flex items-center gap-5`}>
      <CalendarDateTile dateStr={meeting.meeting_date} />

      {/* Details */}
      <div className="flex-1 min-w-0">
        <h3 onClick={() => onOpen(meeting)} className="font-bold text-base text-foreground truncate cursor-pointer hover:text-primary transition-colors">{meeting.title}</h3>
        <div className="flex items-center gap-4 mt-1 text-sm text-muted-foreground">
          {meeting.start_time && (
            <span className="flex items-center gap-1.5">
              <Clock className="w-3.5 h-3.5" /> {formatTime12(meeting.start_time)}
            </span>
          )}
          {meeting.location && (
            <span className="flex items-center gap-1.5 truncate">
              <MapPin className="w-3.5 h-3.5 shrink-0" /> {meeting.location}
            </span>
          )}
        </div>
      </div>

      {/* Actions — same controls as the Action Register cards */}
      <div className="flex items-center gap-1.5 shrink-0">
        <Button variant="outline" size="sm" onClick={() => onOpen(meeting)} className={ACTION_BUTTON}>
          <ExternalLink className="w-4 h-4" /> Open
        </Button>
        <Button variant="outline" size="sm" onClick={() => onEdit(meeting)} className={ACTION_BUTTON}>
          <Pencil className="w-4 h-4" /> Edit
        </Button>
        <Button variant="outline" size="sm" onClick={() => onDelete(meeting)} className={`${ACTION_BUTTON} text-muted-foreground hover:text-destructive hover:border-destructive/30 hover:bg-destructive/5`}>
          <Trash2 className="w-4 h-4" /> Delete
        </Button>
      </div>
    </div>
  );
}