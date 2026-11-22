import React, { useState, useRef, useEffect } from 'react';
import { ArrowDownUp, ArrowUp, ArrowDown, Check, X } from 'lucide-react';
import ToolbarButton from '@/components/shared/table/ToolbarButton';

function Menu({ onClose, children }) {
  const ref = useRef(null);
  useEffect(() => {
    const handler = (e) => { if (ref.current && !ref.current.contains(e.target)) onClose(); };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [onClose]);
  return (
    <div ref={ref} className="animate-dropdown-enter absolute top-full mt-1.5 right-0 z-50 min-w-[220px] bg-popover border border-border rounded-lg shadow-lg py-1.5">
      {children}
    </div>
  );
}

/**
 * Sort button + dropdown. `options` is an array of { id, label } from SORT_OPTIONS.
 * `sort` is { field, direction } or null. Selecting a direction calls onChange.
 */
export default function SortMenu({ options, sort, onChange }) {
  const [open, setOpen] = useState(false);
  const active = !!sort?.field;

  const choose = (field, direction) => {
    onChange({ field, direction });
    setOpen(false);
  };

  return (
    <div className="relative">
      <ToolbarButton
        icon={ArrowDownUp}
        label="Sort"
        active={active}
        onClick={() => setOpen((o) => !o)}
      />
      {open && (
        <Menu onClose={() => setOpen(false)}>
          <div className="px-3 py-1 text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">Sort by</div>
          {options.map((opt) => (
            <div key={opt.id}>
              <div className="px-3 pt-1.5 pb-0.5 text-xs font-medium text-foreground">{opt.label}</div>
              <button
                onClick={() => choose(opt.id, 'asc')}
                className="w-full flex items-center justify-between px-3 py-1.5 text-sm hover:bg-muted/50 text-left"
              >
                <span className="flex items-center gap-2"><ArrowUp className="w-3.5 h-3.5 text-muted-foreground" /> {opt.ascLabel || 'Ascending'}</span>
                {sort?.field === opt.id && sort?.direction === 'asc' && <Check className="w-3.5 h-3.5 text-primary" />}
              </button>
              <button
                onClick={() => choose(opt.id, 'desc')}
                className="w-full flex items-center justify-between px-3 py-1.5 text-sm hover:bg-muted/50 text-left"
              >
                <span className="flex items-center gap-2"><ArrowDown className="w-3.5 h-3.5 text-muted-foreground" /> {opt.descLabel || 'Descending'}</span>
                {sort?.field === opt.id && sort?.direction === 'desc' && <Check className="w-3.5 h-3.5 text-primary" />}
              </button>
            </div>
          ))}
          {active && (
            <>
              <div className="my-1 border-t border-border" />
              <button onClick={() => { onChange(null); setOpen(false); }} className="w-full flex items-center gap-2 px-3 py-1.5 text-sm text-destructive hover:bg-muted/50 text-left">
                <X className="w-3.5 h-3.5" /> Clear Sort
              </button>
            </>
          )}
        </Menu>
      )}
    </div>
  );
}