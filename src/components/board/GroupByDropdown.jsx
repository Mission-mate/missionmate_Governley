import React, { useState, useRef, useEffect } from 'react';
import { LayoutGrid, Check, X } from 'lucide-react';
import ToolbarButton from '@/components/shared/table/ToolbarButton';

/**
 * Reusable "Group" dropdown styled to match the Contacts toolbar group button.
 * options: [{ key, label }], value: current key, onChange: (key) => void
 */
export default function GroupByDropdown({ options, value, onChange }) {
  const [open, setOpen] = useState(false);
  const ref = useRef(null);
  const active = value && value !== 'none';

  useEffect(() => {
    const handler = (e) => {
      if (ref.current && !ref.current.contains(e.target)) setOpen(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  return (
    <div className="relative" ref={ref}>
      <ToolbarButton
        icon={LayoutGrid}
        label="Group"
        active={active}
        onClick={() => setOpen((v) => !v)} />
      {open &&
      <div className="animate-dropdown-enter absolute right-0 top-full mt-1 z-50 w-56 bg-white dark:bg-card border border-border rounded-lg shadow-lg py-1">
          <p className="px-3 py-1.5 text-xs font-semibold text-muted-foreground uppercase tracking-wider">Group By</p>
          {options.filter((opt) => opt.key !== 'none').map((opt) =>
        <button
          key={opt.key}
          onClick={() => {onChange(opt.key);setOpen(false);}}
          className="w-full text-left px-3 py-2 text-sm flex items-center justify-between gap-2 hover:bg-primary/10 transition-colors">
          
              <span className="text-foreground">{opt.label}</span>
              {value === opt.key && <Check className="w-4 h-4 text-primary shrink-0" strokeWidth={2.5} />}
            </button>
        )}
          {active &&
        <>
              <div className="my-1 border-t border-border" />
              <button
            onClick={() => {onChange('none');setOpen(false);}}
            className="w-full text-left px-3 py-2 text-sm flex items-center gap-2 text-destructive hover:bg-primary/10 transition-colors">
            
                <X className="w-3.5 h-3.5" /> Clear Group
              </button>
            </>
        }
        </div>
      }
    </div>);

}