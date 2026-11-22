import React, { useState, useRef, useEffect } from 'react';
import { ChevronDown } from 'lucide-react';
import { cn } from '@/lib/utils';
import { STATUS_PILL } from '@/lib/whsTabs';

/** Floating-bar dropdown that applies one pill-labelled value to the selection. */
export default function BulkValueMenu({ icon: Icon, label, values, onPick, className }) {
  const [open, setOpen] = useState(false);
  const ref = useRef();
  useEffect(() => {
    const h = (e) => { if (ref.current && !ref.current.contains(e.target)) setOpen(false); };
    document.addEventListener('mousedown', h);
    return () => document.removeEventListener('mousedown', h);
  }, []);
  return (
    <div ref={ref} className="relative">
      <button onClick={() => setOpen((v) => !v)} className={className}>
        <Icon className="w-4 h-4" /> {label} <ChevronDown className="w-3.5 h-3.5" />
      </button>
      {open && (
        <div className="animate-dropdown-enter absolute bottom-full mb-2 left-0 bg-popover border border-border rounded-xl shadow-xl py-1.5 min-w-[170px]">
          {values.map((s) => (
            <button key={s} onClick={() => { setOpen(false); onPick(s); }}
              className="flex w-full px-4 py-2 hover:bg-muted/50 transition-colors">
              <span className={cn('px-2 py-0.5 rounded-full text-xs font-medium', STATUS_PILL[s])}>{s}</span>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}