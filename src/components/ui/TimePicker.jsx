import React, { useState } from 'react';
import { Clock, X } from 'lucide-react';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import TimeWheel from '@/components/ui/TimeWheel';
import { cn } from '@/lib/utils';

const pad = (n) => String(n).padStart(2, '0');
const HOURS = Array.from({ length: 12 }, (_, i) => pad(i + 1));
// Minutes step in fives; the wheel index is the option position, the label is the value.
const MINUTES = Array.from({ length: 12 }, (_, i) => pad(i * 5));
const PERIODS = ['AM', 'PM'];

// "HH:mm" (24-hour) → wheel positions. With no value yet, start on the current hour.
// A stored minute off the five-minute grid snaps to the nearest step.
function toWheels(value) {
  const [h, m] = value ? value.split(':').map(Number) : [new Date().getHours(), 0];
  return { hour: (h + 11) % 12, minute: Math.min(11, Math.round((m || 0) / 5)), period: h >= 12 ? 1 : 0 };
}

const toValue = ({ hour, minute, period }) => `${pad(((hour + 1) % 12) + period * 12)}:${MINUTES[minute]}`;

// Read back from the saved value, so an off-grid time still displays as stored.
function toLabel(value) {
  const [h, m] = value.split(':').map(Number);
  return `${pad(h % 12 === 0 ? 12 : h % 12)}:${pad(m)} ${h >= 12 ? 'PM' : 'AM'}`;
}

/**
 * Time field with an hour / minute / AM-PM wheel picker.
 * `value` and `onChange` use "HH:mm" 24-hour strings; '' means no time.
 */
export default function TimePicker({ value, onChange, placeholder = 'Select time', className }) {
  const [open, setOpen] = useState(false);
  const [draft, setDraft] = useState(() => toWheels(value));

  const onOpenChange = (next) => {
    if (next) setDraft(toWheels(value));
    setOpen(next);
  };
  const setPart = (part) => (i) => setDraft((d) => ({ ...d, [part]: i }));
  const confirm = () => { onChange(toValue(draft)); setOpen(false); };

  return (
    <div className={cn('relative', className)}>
      <Popover open={open} onOpenChange={onOpenChange}>
        <PopoverTrigger asChild>
          <button
            type="button"
            className={cn(
              'flex items-center gap-2 h-9 w-full rounded-md border border-input bg-transparent pl-3 pr-8 text-sm shadow-sm transition-colors hover:border-primary/50 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring',
              !value && 'text-muted-foreground'
            )}
          >
            <Clock className="w-3.5 h-3.5 text-muted-foreground shrink-0" />
            <span className="truncate tabular-nums">{value ? toLabel(value) : placeholder}</span>
          </button>
        </PopoverTrigger>
        <PopoverContent align="start" sideOffset={6} className="z-[120] w-[var(--radix-popover-trigger-width)] p-0 rounded-xl overflow-hidden shadow-xl">
          <div className="relative flex px-2">
            <div className="absolute inset-x-2 top-20 h-10 rounded-lg bg-muted" />
            <TimeWheel loop label="Hour" items={HOURS} index={draft.hour} onChange={setPart('hour')} />
            <TimeWheel loop label="Minute" items={MINUTES} index={draft.minute} onChange={setPart('minute')} />
            <TimeWheel label="AM or PM" items={PERIODS} index={draft.period} onChange={setPart('period')} />
          </div>
          <div className="flex items-center justify-between px-4 py-2.5 border-t border-border">
            <button type="button" onClick={() => setOpen(false)} className="text-sm text-muted-foreground hover:text-foreground transition-colors">Cancel</button>
            <button type="button" onClick={confirm} className="text-sm font-semibold text-primary hover:text-primary/80 transition-colors">OK</button>
          </div>
        </PopoverContent>
      </Popover>
      {value && (
        <button
          type="button"
          aria-label="Clear time"
          onClick={() => onChange('')}
          className="absolute right-2.5 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
        >
          <X className="w-3.5 h-3.5" />
        </button>
      )}
    </div>
  );
}