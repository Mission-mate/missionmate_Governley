import React, { useState } from 'react';
import { format, parseISO, isValid } from 'date-fns';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { cn } from '@/lib/utils';
import { META_EDITABLE } from '@/components/shared/metaStyles';

const toDate = (iso) => { if (!iso) return undefined; const d = parseISO(iso); return isValid(d) ? d : undefined; };

/** Click-to-edit due date with a calendar popover and a clear action. */
export default function TaskDueDatePicker({ value, onChange, readOnly = false }) {
  const [open, setOpen] = useState(false);
  const selected = toDate(value);
  const label = selected ? format(selected, 'd MMM yyyy') : 'No due date';
  if (readOnly) return <span className={cn(!selected && 'text-muted-foreground')}>{label}</span>;

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <button type="button" title="Set due date" className={cn('px-2.5 py-1 -ml-2.5', META_EDITABLE, !selected && 'text-muted-foreground')}>
          {label}
        </button>
      </PopoverTrigger>
      <PopoverContent className="w-auto p-0 z-[200]" align="start">
        <Calendar
          mode="single"
          selected={selected}
          defaultMonth={selected}
          onSelect={(d) => { if (d) onChange(format(d, 'yyyy-MM-dd')); setOpen(false); }}
          initialFocus
        />
        {selected && (
          <div className="border-t border-border p-1.5">
            <button
              type="button"
              onClick={() => { onChange(null); setOpen(false); }}
              className="w-full rounded-md px-2 py-1.5 text-xs text-muted-foreground hover:bg-muted hover:text-foreground transition-colors"
            >
              Clear date
            </button>
          </div>
        )}
      </PopoverContent>
    </Popover>
  );
}