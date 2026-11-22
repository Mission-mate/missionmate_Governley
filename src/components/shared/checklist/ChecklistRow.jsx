import React from 'react';
import { GripVertical, Calendar, ExternalLink, FileText } from 'lucide-react';
import { cn } from '@/lib/utils';
import CircleCheck from '@/components/shared/CircleCheck';
import PersonInitialsAvatar from '@/components/shared/PersonInitialsAvatar';
import IconTip from '@/components/shared/IconTip';
import { statusTone } from '@/lib/obligationTasks';
import { dueLabel } from './checklistDates';
import RailBadgeIcon from '@/components/shared/RailBadgeIcon';

/** Checklist line: selector, title, then owner · due date · status pill beneath. Open icon shows on hover. */
export default function ChecklistRow({ item, status, overdue, onOpen, selected = false, onToggleSelect, selectable = true, moving = false, dragging = false }) {
  const done = status === 'Completed';
  const tone = statusTone(status);
  const due = dueLabel(item.due_date, done);
  const hasNotes = !!item.description?.replace(/<[^>]*>|&nbsp;/g, '').trim();

  return (
    <div
      onClick={moving ? undefined : () => onOpen(item.id)}
      className={cn(
        'group relative flex items-start gap-3 px-6 py-3 transition-colors after:absolute after:bottom-0 after:inset-x-0 after:h-px after:bg-border',
        moving ? 'cursor-grab active:cursor-grabbing select-none' : 'cursor-pointer',
        dragging ? 'bg-card shadow-lg ring-1 ring-border' : selected ? 'bg-primary/10' : 'hover:bg-sidebar-accent/70'
      )}
    >
      {moving ? (
        <GripVertical className="self-center w-5 h-5 text-muted-foreground shrink-0" />
      ) : selectable && (
        <span onClick={(e) => e.stopPropagation()} className="self-center flex shrink-0">
          <CircleCheck checked={selected} onChange={() => onToggleSelect(item.id)} />
        </span>
      )}
      <div className="flex-1 min-w-0">
        <p className={cn('text-[13px] font-medium truncate', done ? 'line-through text-muted-foreground' : 'text-foreground')}>{item.title}</p>
        <div className="mt-1 flex flex-wrap items-center gap-x-2 gap-y-1 text-xs text-muted-foreground">
          {item.owner_name && (
            <span className="flex items-center gap-1.5 min-w-0">
              <PersonInitialsAvatar name={item.owner_name} className="h-5 w-5 text-[8px] shrink-0" />
              <span className="truncate">{item.owner_name}</span>
            </span>
          )}
          {item.owner_name && due && <span className="text-muted-foreground/50">•</span>}
          {due && (
            <span className={cn('flex items-center gap-1 tabular-nums whitespace-nowrap', overdue && 'text-overdue font-semibold')}>
              <Calendar className="w-3.5 h-3.5" /> {due}
            </span>
          )}
          <span className={cn('inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full font-medium', tone.bg, tone.text)}>
            <span className={cn('w-1.5 h-1.5 rounded-full', tone.dot)} /> {status}
          </span>
          {hasNotes && (
            <IconTip label="Has notes">
              <span className="inline-flex shrink-0" aria-label="Has notes">
                <RailBadgeIcon icon={FileText} tone="blue" className="w-5 h-5 [&>svg]:w-3 [&>svg]:h-3" />
              </span>
            </IconTip>
          )}
        </div>
      </div>
      {!moving && (
        <IconTip label="Open">
          <span className="self-center shrink-0 p-1.5 rounded-md bg-muted text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity">
            <ExternalLink className="w-4 h-4" />
          </span>
        </IconTip>
      )}
    </div>
  );
}