import React, { useState } from 'react';
import { Check, ChevronsUpDown } from 'lucide-react';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Command, CommandEmpty, CommandInput, CommandItem, CommandList } from '@/components/ui/command';
import { cn } from '@/lib/utils';

/** Search-and-select an existing donor from the register. */
export default function DonorPicker({ value, onChange, donors }) {
  const [open, setOpen] = useState(false);
  const current = donors.find((d) => d.id === value);
  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <button type="button" className="w-full h-9 px-3 rounded-md border border-input bg-card text-sm flex items-center justify-between gap-2">
          <span className={cn('truncate', !current && 'text-muted-foreground')}>{current ? current.donor_name : 'Search and select a donor...'}</span>
          <ChevronsUpDown className="w-4 h-4 text-muted-foreground shrink-0" />
        </button>
      </PopoverTrigger>
      <PopoverContent className="z-[300] p-0 w-[var(--radix-popover-trigger-width)]" align="start">
        <Command>
          <CommandInput placeholder="Search donors..." />
          <CommandList>
            <CommandEmpty>No donors found.</CommandEmpty>
            {donors.map((d) => (
              <CommandItem key={d.id} value={`${d.donor_name} ${d.donor_code || ''} ${d.id}`} onSelect={() => { onChange(d.id); setOpen(false); }}>
                <Check className={cn('w-4 h-4', value === d.id ? 'opacity-100' : 'opacity-0')} />
                <span className="truncate">{d.donor_name}</span>
                {d.donor_code && <span className="ml-auto text-xs text-muted-foreground">{d.donor_code}</span>}
              </CommandItem>
            ))}
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
}