import React, { useState } from 'react';
import { ChevronDown, X } from 'lucide-react';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Command, CommandEmpty, CommandInput, CommandItem, CommandList } from '@/components/ui/command';
import { cn } from '@/lib/utils';

/** Searchable parent-policy picker; blank by default, clearable with X. */
export default function ParentDocumentPicker({ value, onChange, parents, disabled, emptyText = 'No matching policies.', placeholder = 'Search by Title', showType = false }) {
  const [open, setOpen] = useState(false);
  const selected = parents.find((p) => p.id === value);
  return (
    <Popover open={open} onOpenChange={setOpen}>
      <div className="relative">
        <PopoverTrigger asChild disabled={disabled}>
          <button type="button" className={cn('flex h-9 w-full items-center rounded-md border border-input bg-white px-3 pr-14 text-sm shadow-sm text-left focus:outline-none focus:ring-1 focus:ring-ring disabled:cursor-not-allowed disabled:opacity-50', !selected && 'text-muted-foreground')}>
            <span className="truncate">{selected ? selected.title : placeholder}</span>
          </button>
        </PopoverTrigger>
        <div className="absolute right-3 top-1/2 -translate-y-1/2 flex items-center gap-1.5 pointer-events-none">
          {selected && !disabled && (
            <button type="button" aria-label="Clear parent document" onClick={() => onChange('')} className="pointer-events-auto text-muted-foreground hover:text-foreground"><X className="w-3.5 h-3.5" /></button>
          )}
          <ChevronDown className={cn('w-4 h-4 opacity-50 transition-transform', open && 'rotate-180')} />
        </div>
      </div>
      <PopoverContent align="start" className="p-0 w-[var(--radix-popover-trigger-width)] z-[120]">
        <Command>
          <CommandInput placeholder="Search by Title" />
          <CommandList>
            <CommandEmpty>{emptyText}</CommandEmpty>
            {parents.map((p) => (
              <CommandItem key={p.id} value={`${p.title} ${p.id}`} onSelect={() => { onChange(p.id); setOpen(false); }}>
                <span className="truncate">{p.title}</span>
                {showType && p.document_type && <span className="ml-auto pl-2 text-xs text-muted-foreground shrink-0">{p.document_type}</span>}
              </CommandItem>
            ))}
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
}