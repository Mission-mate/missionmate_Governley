import React, { useState } from 'react';
import { format, parseISO } from 'date-fns';
import { Calendar as CalendarIcon, CircleDashed, User } from 'lucide-react';
import { META_ICON_CIRCLE } from '@/components/shared/metaStyles';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import TaskStatusPill from '@/components/compliance/tasks/TaskStatusPill';

const chip = 'flex items-center gap-1.5 rounded-full pl-0.5 pr-2 py-0.5 text-xs font-semibold text-muted-foreground hover:bg-muted hover:text-foreground transition-colors';
const Divider = () => <span className="h-4 w-px bg-border" />;

/** Owner · Due date · Status controls under the checklist composer's title field. */
export default function ComposerMetaBar({ owner, date, status, statuses, onOwnerChange, onDateChange, onStatusChange }) {
  const [dateOpen, setDateOpen] = useState(false);
  const selected = date ? parseISO(date) : undefined;

  return (
    <div className="flex items-center gap-1 min-w-0 flex-wrap">
      <label className={`${chip} cursor-text`}>
        <span className={META_ICON_CIRCLE}><User className="w-3.5 h-3.5" /></span>
        <input value={owner} onChange={(e) => onOwnerChange(e.target.value)} placeholder="Owner"
          className="w-20 bg-transparent outline-none text-xs font-semibold text-foreground placeholder:text-muted-foreground" />
      </label>
      <Divider />
      <Popover open={dateOpen} onOpenChange={setDateOpen}>
        <PopoverTrigger asChild>
          <button type="button" className={chip}>
            <span className={META_ICON_CIRCLE}><CalendarIcon className="w-3.5 h-3.5" /></span>
            <span className={selected ? 'text-foreground' : ''}>{selected ? format(selected, 'd MMM yyyy') : 'Due date'}</span>
          </button>
        </PopoverTrigger>
        <PopoverContent className="w-auto p-0 z-[200]" align="start">
          <Calendar mode="single" selected={selected} defaultMonth={selected} initialFocus
            onSelect={(d) => { onDateChange(d ? format(d, 'yyyy-MM-dd') : ''); setDateOpen(false); }} />
        </PopoverContent>
      </Popover>
      <span className="mx-1.5"><Divider /></span>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <button type="button" className={chip}>
            <span className={META_ICON_CIRCLE}><CircleDashed className="w-3.5 h-3.5" /></span>
            <TaskStatusPill status={status} />
          </button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="start" className="z-[200]">
          {statuses.map((s) => (
            <DropdownMenuItem key={s.value} onSelect={() => onStatusChange(s.value)}><TaskStatusPill status={s.label || s.value} /></DropdownMenuItem>
          ))}
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );
}