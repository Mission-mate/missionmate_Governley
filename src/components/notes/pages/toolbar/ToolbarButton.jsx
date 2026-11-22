import React from 'react';
import { cn } from '@/lib/utils';
import IconTip from '@/components/shared/IconTip';

/** Icon button of the note toolbar: hover tooltip (with optional shortcut) and a filled active state. */
export default function ToolbarButton({ icon: Icon, label, keys, active = false, disabled = false, onClick }) {
  return (
    <IconTip label={<>{label}{keys && <span className="ml-1.5 text-muted-foreground">{keys}</span>}</>}>
      <button
        type="button"
        aria-label={label}
        aria-pressed={active}
        disabled={disabled}
        onClick={onClick}
        className={cn(
          'h-7 w-7 rounded-md flex items-center justify-center shrink-0 transition-colors disabled:opacity-40 disabled:pointer-events-none',
          active ? 'bg-foreground/10 text-foreground' : 'text-muted-foreground hover:bg-foreground/5 hover:text-foreground'
        )}
      >
        <Icon className="w-4 h-4" />
      </button>
    </IconTip>
  );
}