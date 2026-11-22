import React, { useState } from 'react';
import { Check, ChevronsUpDown } from 'lucide-react';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from '@/components/ui/command';
import { cn } from '@/lib/utils';

/** Searchable picker over the register's credential types. */
export default function CredentialTypeSelect({ value, onChange, options, error }) {
  const [open, setOpen] = useState(false);
  const all = value && !options.includes(value) ? [value, ...options] : options;
  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <button type="button" className={cn('w-full h-9 flex items-center justify-between rounded-md border bg-card px-3 text-sm', error ? 'border-destructive' : 'border-input')}>
          <span className={value ? 'text-foreground' : 'text-muted-foreground'}>{value || 'Search credential types...'}</span>
          <ChevronsUpDown className="w-4 h-4 text-muted-foreground" />
        </button>
      </PopoverTrigger>
      <PopoverContent className="z-[300] p-0 w-[var(--radix-popover-trigger-width)]" align="start">
        <Command>
          <CommandInput placeholder="Search credential types..." />
          <CommandList>
            <CommandEmpty>No credential type found.</CommandEmpty>
            <CommandGroup>
              {all.map((name) => (
                <CommandItem key={name} value={name} onSelect={() => { onChange(name); setOpen(false); }}>
                  <Check className={cn('w-4 h-4', value === name ? 'opacity-100' : 'opacity-0')} /> {name}
                </CommandItem>
              ))}
            </CommandGroup>
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
}