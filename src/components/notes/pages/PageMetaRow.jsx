import React, { useState } from 'react';
import { format, parseISO, isValid } from 'date-fns';
import { Calendar as CalendarIcon, User } from 'lucide-react';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import PersonInitialsAvatar from '@/components/shared/PersonInitialsAvatar';
import { META_ICON_CIRCLE, META_EDITABLE } from '@/components/shared/metaStyles';

const toDate = (iso) => { if (!iso) return undefined; const d = parseISO(iso); return isValid(d) ? d : undefined; };

const ICON_CIRCLE = META_ICON_CIRCLE;
const EDITABLE = `flex items-center gap-2 pl-0.5 pr-2.5 py-0.5 -ml-0.5 ${META_EDITABLE}`;

/** Owner (free text + initials circle) and Date (calendar picker) row under a note page title. */
export default function PageMetaRow({ owner, date, onOwnerChange, onDateChange, readOnly = false }) {
  const [open, setOpen] = useState(false);
  const selected = toDate(date);
  const dateLabel = selected ? format(selected, 'd MMM yyyy') : (readOnly ? 'No date' : 'Set date');
  const hasOwner = !!String(owner || '').trim();
  const ownerIcon = hasOwner
    ? <PersonInitialsAvatar name={owner} className="h-6 w-6 text-[9px]" />
    : <span className={ICON_CIRCLE}><User className="w-3.5 h-3.5" /></span>;
  const dateIcon = <span className={ICON_CIRCLE}><CalendarIcon className="w-3.5 h-3.5" /></span>;

  return (
    <div className="mt-2 flex items-center gap-6 text-sm font-semibold text-muted-foreground">
      {readOnly ? (
        <div className="flex items-center gap-2 min-w-0">
          {ownerIcon}
          <span className="truncate">{hasOwner ? owner : 'No owner'}</span>
        </div>
      ) : (
        <label title="Assign note owner" className={`${EDITABLE} min-w-0`}>
          {ownerIcon}
          <input
            value={owner || ''}
            onChange={(e) => onOwnerChange(e.target.value)}
            placeholder="Add owner"
            className="w-40 bg-transparent border-0 p-0 text-sm font-semibold text-inherit outline-none cursor-text placeholder:text-muted-foreground/60"
          />
        </label>
      )}

      {readOnly ? (
        <div className="flex items-center gap-2">
          {dateIcon}
          <span>{dateLabel}</span>
        </div>
      ) : (
        <Popover open={open} onOpenChange={setOpen}>
          <PopoverTrigger asChild>
            <button type="button" title="Set note date" className={EDITABLE}>
              {dateIcon}
              <span>{dateLabel}</span>
            </button>
          </PopoverTrigger>
          <PopoverContent className="w-auto p-0 z-[200]" align="start">
            <Calendar
              mode="single"
              selected={selected}
              defaultMonth={selected}
              onSelect={(d) => { if (d) onDateChange(format(d, 'yyyy-MM-dd')); setOpen(false); }}
              initialFocus
            />
          </PopoverContent>
        </Popover>
      )}
    </div>
  );
}