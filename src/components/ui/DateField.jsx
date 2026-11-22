import React, { useState, useRef, useEffect } from 'react';
import { format, parseISO, isValid, parse } from 'date-fns';
import { Calendar as CalendarIcon } from 'lucide-react';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { cn } from '@/lib/utils';

/**
 * A standard, typeable date field for the Grant Management module.
 *
 * - Stores/emits values as ISO (yyyy-MM-dd) via onChange.
 * - Displays selected dates as "DD MMM YYYY" (e.g. 2 Jul 2028).
 * - Lets the user type a date directly in the field, or pick from a calendar.
 *
 * Accepted typed formats include: "2 Jul 2028", "02/07/2028", "2028-07-02", "2 July 2028".
 */
const TYPE_FORMATS = [
  'd MMM yyyy',
  'd MMMM yyyy',
  'dd MMM yyyy',
  'dd/MM/yyyy',
  'd/MM/yyyy',
  'dd-MM-yyyy',
  'yyyy-MM-dd',
];

function toDisplay(iso) {
  if (!iso) return '';
  try {
    const d = parseISO(iso);
    if (isValid(d)) return format(d, 'd MMM yyyy');
  } catch { /* ignore */ }
  return '';
}

function parseTyped(text) {
  const trimmed = (text || '').trim();
  if (!trimmed) return null;
  for (const fmt of TYPE_FORMATS) {
    const d = parse(trimmed, fmt, new Date());
    if (isValid(d)) return d;
  }
  const fallback = new Date(trimmed);
  if (isValid(fallback)) return fallback;
  return null;
}

export default function DateField({ value, onChange, placeholder = 'DD/MM/YYYY', className, inputClassName, disabled, minDate, maxDate }) {
  // Optional inclusive range (ISO yyyy-MM-dd); dates outside it can't be picked or typed.
  const inRange = (iso) => (!minDate || iso >= minDate) && (!maxDate || iso <= maxDate);
  const disabledDays = [
    minDate && { before: parseISO(minDate) },
    maxDate && { after: parseISO(maxDate) },
  ].filter(Boolean);
  const [open, setOpen] = useState(false);
  const [text, setText] = useState(toDisplay(value));
  const inputRef = useRef(null);

  // Keep the text in sync when the external value changes (e.g. form reset / edit load)
  useEffect(() => {
    setText(toDisplay(value));
  }, [value]);

  const commitTyped = () => {
    const parsed = parseTyped(text);
    if (parsed && inRange(format(parsed, 'yyyy-MM-dd'))) {
      onChange(format(parsed, 'yyyy-MM-dd'));
      setText(format(parsed, 'd MMM yyyy'));
    } else if (!text.trim()) {
      onChange('');
      setText('');
    } else {
      // Invalid — revert to last valid value
      setText(toDisplay(value));
    }
  };

  const selected = value ? (() => { try { const d = parseISO(value); return isValid(d) ? d : undefined; } catch { return undefined; } })() : undefined;

  return (
    <div className={cn('relative', className)}>
      <input
        ref={inputRef}
        type="text"
        value={text}
        disabled={disabled}
        onChange={(e) => setText(e.target.value)}
        onBlur={commitTyped}
        onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); commitTyped(); inputRef.current?.blur(); } }}
        placeholder={placeholder}
        className={cn('flex h-9 w-full rounded-md border border-input bg-transparent pl-3 pr-9 py-1 text-sm shadow-sm transition-colors placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50', inputClassName)}
      />
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <button
            type="button"
            disabled={disabled}
            className="absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground disabled:opacity-50"
            aria-label="Open calendar"
          >
            <CalendarIcon className="w-4 h-4" />
          </button>
        </PopoverTrigger>
        <PopoverContent className="w-auto p-0 z-[120]" align="end">
          <Calendar
            mode="single"
            selected={selected}
            defaultMonth={selected || (minDate && new Date() < parseISO(minDate) ? parseISO(minDate) : maxDate && new Date() > parseISO(maxDate) ? parseISO(maxDate) : undefined)}
            disabled={disabledDays}
            fromDate={minDate ? parseISO(minDate) : undefined}
            toDate={maxDate ? parseISO(maxDate) : undefined}
            onSelect={(d) => {
              if (d) {
                onChange(format(d, 'yyyy-MM-dd'));
                setText(format(d, 'd MMM yyyy'));
              }
              setOpen(false);
            }}
            initialFocus
          />
        </PopoverContent>
      </Popover>
    </div>
  );
}