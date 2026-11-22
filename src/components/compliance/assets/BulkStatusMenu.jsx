import React, { useState, useRef, useEffect } from 'react';
import { CircleCheck as CircleCheckIcon, ChevronDown } from 'lucide-react';
import { Button } from '@/components/ui/button';

const DOTS = { green: 'bg-green-500', red: 'bg-red-500', orange: 'bg-orange-500', blue: 'bg-blue-500', gray: 'bg-slate-400' };

/** Dropdown status picker used inside floating action bars. Options: { name, dot? | color? }. */
export default function BulkStatusMenu({ label, options, onChange, resetKey }) {
  const [open, setOpen] = useState(false);
  const ref = useRef(null);
  useEffect(() => {
    const handler = (e) => { if (ref.current && !ref.current.contains(e.target)) setOpen(false); };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);
  useEffect(() => { setOpen(false); }, [resetKey]);

  return (
    <div className="relative" ref={ref}>
      <Button variant="ghost" size="sm" onClick={() => setOpen((o) => !o)} className="h-8 gap-2 text-sm">
        <CircleCheckIcon className="w-4 h-4" /> {label} <ChevronDown className="w-3.5 h-3.5" />
      </Button>
      {open && (
        <div className="animate-dropdown-enter absolute bottom-full mb-2 left-0 w-40 rounded-lg border border-border bg-popover shadow-lg py-1 z-10">
          {options.map((s) => (
            <button key={s.name} onClick={() => { setOpen(false); onChange(s.name); }}
              className="w-full flex items-center gap-2 px-3 py-2 text-sm text-left hover:bg-muted/60 transition-colors">
              <span className={`inline-block w-2 h-2 rounded-full ${s.dot || DOTS[s.color] || DOTS.gray}`} /> {s.name}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}