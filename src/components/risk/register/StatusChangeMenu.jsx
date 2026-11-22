import React, { useState, useRef, useEffect } from 'react';
import { RefreshCw, ChevronDown } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

/**
 * "Change Status" dropdown for the register floating action bar.
 * options: array of { value, dot } — dot is a Tailwind bg-* class.
 */
export default function StatusChangeMenu({ options, onChange, label = 'Change Status', icon: Icon = RefreshCw }) {
  const [open, setOpen] = useState(false);
  const ref = useRef(null);

  useEffect(() => {
    const handler = (e) => { if (ref.current && !ref.current.contains(e.target)) setOpen(false); };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  return (
    <div className="relative" ref={ref}>
      <Button variant="ghost" size="sm" onClick={() => setOpen((o) => !o)} className="h-8 gap-2 text-sm">
        <Icon className="w-4 h-4" /> {label} <ChevronDown className="w-3.5 h-3.5" />
      </Button>
      {open && (
        <div className="animate-dropdown-enter absolute bottom-full mb-2 left-0 w-44 rounded-lg border border-border bg-popover shadow-lg py-1 z-10">
          {options.map((opt) => (
            <button
              key={opt.value}
              onClick={() => { setOpen(false); onChange(opt.value); }}
              className="w-full flex items-center gap-2.5 px-3 py-2 text-sm text-left hover:bg-primary/10 transition-colors"
            >
              <span className={cn('w-2 h-2 rounded-full shrink-0', opt.dot)} />
              {opt.value}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}