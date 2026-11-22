import React, { useState } from 'react';
import { ChevronDown } from 'lucide-react';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import OptionLabel from '@/components/shared/OptionLabel';

/**
 * White single-select field (matching the Edit Obligation pane) that renders
 * colour-coded option labels in both the field and the dropdown list.
 * `dotted` switches the labels to dot + coloured text (Health).
 */
export default function OptionSelectField({ options, value, onChange, dotted = false }) {
  const [open, setOpen] = useState(false);
  const opt = (options || []).find((o) => o.name === value);

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <button
          type="button"
          className="h-9 w-full rounded-md border border-input bg-white px-3 text-sm flex items-center justify-between gap-2 focus:outline-none focus:ring-1 focus:ring-ring"
        >
          {value ? <OptionLabel name={value} color={opt?.color} dotted={dotted} /> : <span className="text-muted-foreground">Select...</span>}
          <ChevronDown className="w-4 h-4 text-muted-foreground shrink-0" />
        </button>
      </PopoverTrigger>
      <PopoverContent align="start" className="w-[--radix-popover-trigger-width] p-1 z-[200]">
        <button
          onClick={() => { onChange(''); setOpen(false); }}
          className="w-full text-left px-2 py-1.5 rounded-md text-[13px] text-muted-foreground hover:bg-muted"
        >
          Select...
        </button>
        {(options || []).map((o) => (
          <button
            key={o.name}
            onClick={() => { onChange(o.name); setOpen(false); }}
            className="w-full text-left px-2 py-1.5 rounded-md hover:bg-muted"
          >
            <OptionLabel name={o.name} color={o.color} dotted={dotted} />
          </button>
        ))}
      </PopoverContent>
    </Popover>
  );
}