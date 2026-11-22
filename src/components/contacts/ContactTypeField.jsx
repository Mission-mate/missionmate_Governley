import React, { useState } from 'react';
import { X, ChevronDown, Check } from 'lucide-react';
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select';
import { cn } from '@/lib/utils';
import { isMultiSelect } from '@/lib/contactTypeConfig';

/**
 * Renders the Contact Type input based on the locked field config.
 * - Single select: a normal dropdown -> value is a string.
 * - Multi select: a checkbox dropdown -> value is an array of strings.
 */
export default function ContactTypeField({ config, value, onChange, placeholder = 'Select contact type' }) {
  const multi = isMultiSelect(config);
  const options = config?.options || [];
  const [open, setOpen] = useState(false);

  if (!multi) {
    return (
      <Select value={value || ''} onValueChange={onChange}>
        <SelectTrigger className="h-9 text-sm">
          <SelectValue placeholder={placeholder} />
        </SelectTrigger>
        <SelectContent>
          {options.map((o) => <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>)}
        </SelectContent>
      </Select>
    );
  }

  // Multi-select
  const selected = Array.isArray(value) ? value : (value ? [value] : []);
  const toggle = (v) => {
    if (selected.includes(v)) onChange(selected.filter((s) => s !== v));
    else onChange([...selected, v]);
  };
  const labelFor = (v) => options.find((o) => o.value === v)?.label || v;

  return (
    <div className="relative">
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        onBlur={() => setTimeout(() => setOpen(false), 150)}
        className="w-full min-h-9 px-3 py-1.5 flex items-center justify-between gap-2 border border-input rounded-md bg-transparent text-sm hover:bg-muted/30 transition-colors"
      >
        <span className="flex flex-wrap gap-1 flex-1 text-left">
          {selected.length === 0 ? (
            <span className="text-muted-foreground">{placeholder}</span>
          ) : (
            selected.map((v) => (
              <span key={v} className="inline-flex items-center gap-1 text-xs font-medium bg-primary/10 text-primary rounded-full px-2 py-0.5">
                {labelFor(v)}
                <span
                  role="button"
                  onMouseDown={(e) => { e.preventDefault(); e.stopPropagation(); toggle(v); }}
                  className="hover:opacity-70"
                >
                  <X className="w-3 h-3" />
                </span>
              </span>
            ))
          )}
        </span>
        <ChevronDown className="w-4 h-4 text-muted-foreground shrink-0" />
      </button>

      {open && (
        <div className="animate-dropdown-enter absolute z-50 top-full mt-1 left-0 right-0 bg-white dark:bg-card border border-border rounded-lg shadow-xl max-h-56 overflow-y-auto py-1">
          {options.map((o) => {
            const isSel = selected.includes(o.value);
            return (
              <button
                key={o.value}
                type="button"
                onMouseDown={(e) => { e.preventDefault(); toggle(o.value); }}
                className={cn(
                  'w-full flex items-center justify-between px-3 py-2 text-sm hover:bg-primary/10 transition-colors',
                  isSel && 'font-medium text-foreground'
                )}
              >
                {o.label}
                {isSel && <Check className="w-4 h-4 text-primary" />}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}