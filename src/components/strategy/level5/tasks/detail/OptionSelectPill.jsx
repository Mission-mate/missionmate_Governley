import React, { useState } from 'react';
import { ChevronDown } from 'lucide-react';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { cn } from '@/lib/utils';
import { OPTION_COLORS } from '@/lib/registerColors';

/** Coloured option pill + chevron picker, matching the table's option badges. */
export default function OptionSelectPill({ options, value, onChange }) {
  const [open, setOpen] = useState(false);
  const opt = (options || []).find((o) => o.name === value);
  const c = OPTION_COLORS.find((x) => x.id === opt?.color);
  return (
    <Popover open={open} onOpenChange={setOpen} modal={false}>
      <PopoverTrigger asChild>
        <button className="inline-flex items-center gap-1 group">
          {value ? (
            <span className={cn('inline-flex items-center text-xs font-medium rounded-full px-2.5 py-0.5', c ? `${c.bg} ${c.text}` : 'bg-muted text-foreground')}>
              {value}
            </span>
          ) : (
            <span className="text-[13px] text-muted-foreground">—</span>
          )}
          <ChevronDown className="w-3.5 h-3.5 text-muted-foreground/60 group-hover:text-muted-foreground" />
        </button>
      </PopoverTrigger>
      <PopoverContent align="start" className="w-48 p-1 z-[130]">
        <button
          onClick={() => { onChange(''); setOpen(false); }}
          className="w-full text-left px-2 py-1.5 rounded-md text-[13px] text-muted-foreground hover:bg-muted"
        >
          None
        </button>
        {(options || []).map((o) => {
          const oc = OPTION_COLORS.find((x) => x.id === o.color);
          return (
            <button
              key={o.name}
              onClick={() => { onChange(o.name); setOpen(false); }}
              className="w-full text-left px-2 py-1.5 rounded-md hover:bg-muted"
            >
              <span className={cn('inline-flex items-center text-xs font-medium rounded-full px-2.5 py-0.5', oc ? `${oc.bg} ${oc.text}` : 'bg-muted text-foreground')}>
                {o.name}
              </span>
            </button>
          );
        })}
      </PopoverContent>
    </Popover>
  );
}