import React, { useEffect, useRef } from 'react';
import { ChevronDown, Check } from 'lucide-react';
import { cn } from '@/lib/utils';
import IconTip from '@/components/shared/IconTip';
import { TEXT_BLOCKS } from './toolbarUtils';

/** "Text ∨" dropdown in the note toolbar — switches the current line(s) block type. */
export default function ToolbarBlockMenu({ currentId, open, onOpenChange, onSelect }) {
  const ref = useRef(null);
  const current = TEXT_BLOCKS.find((b) => b.id === currentId) || TEXT_BLOCKS[0];

  useEffect(() => {
    if (!open) return undefined;
    const onDown = (e) => { if (!ref.current?.contains(e.target)) onOpenChange(false); };
    document.addEventListener('mousedown', onDown);
    return () => document.removeEventListener('mousedown', onDown);
  }, [open, onOpenChange]);

  return (
    <div ref={ref} className="relative shrink-0">
      <IconTip label="Text style">
        <button
          type="button"
          aria-haspopup="listbox"
          aria-expanded={open}
          onClick={() => onOpenChange(!open)}
          className={cn(
            'h-7 px-2 rounded-md flex items-center gap-1 text-[13px] font-semibold transition-colors',
            open || current.id !== 'text' ? 'bg-foreground/10 text-foreground' : 'text-muted-foreground hover:bg-foreground/5 hover:text-foreground'
          )}
        >
          {current.label}
          <ChevronDown className="w-3.5 h-3.5 opacity-70" />
        </button>
      </IconTip>
      {open && (
        <div role="listbox" className="animate-dropdown-enter absolute left-0 top-full mt-1.5 w-48 rounded-lg border border-border bg-popover shadow-lg py-1 z-30">
          {TEXT_BLOCKS.map((b) => (
            <button
              key={b.id}
              type="button"
              role="option"
              aria-selected={b.id === current.id}
              onClick={() => onSelect(b)}
              className="w-full flex items-center gap-2 px-2.5 py-1.5 text-left text-[13px] text-popover-foreground hover:bg-muted transition-colors"
            >
              <b.icon className="w-3.5 h-3.5 text-muted-foreground shrink-0" />
              <span className="flex-1 truncate">{b.label}</span>
              {b.id === current.id && <Check className="w-3.5 h-3.5 shrink-0" />}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}