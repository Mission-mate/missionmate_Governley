import React, { useState, useRef, useEffect } from 'react';
import { Check, ChevronDown, X } from 'lucide-react';
import { cn } from '@/lib/utils';

export default function MultiSelectDropdown({ options = [], value, onChange, placeholder = 'Select options' }) {
  const [open, setOpen] = useState(false);
  const ref = useRef(null);
  const arr = Array.isArray(value) ? value : [];

  useEffect(() => {
    const handler = (e) => {
      if (ref.current && !ref.current.contains(e.target)) setOpen(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const labelFor = (v) => options.find((o) => o.value === v)?.label || v;
  const toggle = (v) => onChange(arr.includes(v) ? arr.filter((x) => x !== v) : [...arr, v]);
  const removeTag = (e, v) => { e.stopPropagation(); onChange(arr.filter((x) => x !== v)); };

  return (
    <div ref={ref} className="relative">
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        className="flex min-h-8 w-full items-center justify-between gap-2 rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm focus:outline-none focus:ring-1 focus:ring-ring"
      >
        <div className="flex flex-wrap gap-1.5">
          {arr.length === 0 ? (
            <span className="text-muted-foreground">{placeholder}</span>
          ) : (
            arr.map((v) => (
              <span key={v} className="inline-flex items-center gap-1 text-xs font-medium bg-blue-50 text-blue-700 border border-blue-200 rounded-full px-2 py-0.5">
                {labelFor(v)}
                <span onClick={(e) => removeTag(e, v)} className="hover:opacity-70">
                  <X className="w-3 h-3" />
                </span>
              </span>
            ))
          )}
        </div>
        <ChevronDown className="w-4 h-4 opacity-50 shrink-0" />
      </button>

      {open && (
        <div className="animate-dropdown-enter absolute z-50 top-full mt-1 left-0 right-0 bg-popover border border-border rounded-md shadow-md overflow-hidden max-h-56 overflow-y-auto p-1">
          {options.length === 0 ? (
            <p className="px-2 py-2 text-sm text-muted-foreground text-center">No options.</p>
          ) : (
            options.map((o) => {
              const selected = arr.includes(o.value);
              return (
                <div
                  key={o.value}
                  onClick={() => toggle(o.value)}
                  className={cn(
                    'flex items-center justify-between rounded-sm px-2 py-1.5 text-sm cursor-pointer hover:bg-primary/10',
                    selected && 'bg-accent/50'
                  )}
                >
                  <span>{o.label}</span>
                  {selected && <Check className="w-4 h-4 text-primary" />}
                </div>
              );
            })
          )}
        </div>
      )}
    </div>
  );
}