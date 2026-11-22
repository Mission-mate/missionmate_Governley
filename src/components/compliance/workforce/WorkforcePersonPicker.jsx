import React, { useState } from 'react';
import { Check, ChevronsUpDown } from 'lucide-react';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Command, CommandEmpty, CommandInput, CommandItem, CommandList } from '@/components/ui/command';
import { cn } from '@/lib/utils';
import { statusOf } from '@/lib/workforceRegister';

/** Search-and-select an existing person in this workforce register. */
export default function WorkforcePersonPicker({ value, onChange, people }) {
  const [open, setOpen] = useState(false);
  const current = people.find((p) => p.id === value);
  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <button type="button" className="w-full h-9 px-3 rounded-md border border-input bg-card text-sm flex items-center justify-between gap-2">
          <span className={cn('truncate', !current && 'text-muted-foreground')}>{current ? current.full_name : 'Search and select a person...'}</span>
          <ChevronsUpDown className="w-4 h-4 text-muted-foreground shrink-0" />
        </button>
      </PopoverTrigger>
      <PopoverContent className="z-[300] p-0 w-[var(--radix-popover-trigger-width)]" align="start">
        <Command>
          <CommandInput placeholder="Search people..." />
          <CommandList>
            <CommandEmpty>No people found.</CommandEmpty>
            {people.map((p) => (
              <CommandItem key={p.id} value={`${p.full_name} ${p.role || ''} ${p.id}`} onSelect={() => { onChange(p.id); setOpen(false); }}>
                <Check className={cn('w-4 h-4', value === p.id ? 'opacity-100' : 'opacity-0')} />
                <span className="truncate">{p.full_name}</span>
                <span className="ml-auto text-xs text-muted-foreground truncate">{statusOf(p) === 'Archived' ? 'Archived' : p.role}</span>
              </CommandItem>
            ))}
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
}