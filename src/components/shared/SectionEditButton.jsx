import React from 'react';
import { SquarePen } from 'lucide-react';
import { cn } from '@/lib/utils';

/**
 * Shared inline "Edit" action used in section card headers.
 * SquarePen icon + label, with the same hover treatment as pane header actions.
 *
 * When `disabled` (another section card has unsaved changes) the action is
 * greyed out and explains itself on hover.
 */
export default function SectionEditButton({
  onClick,
  label = 'Edit',
  className,
  disabled = false,
  disabledTitle = 'Save or cancel the current edit first',
}) {
  return (
    <button
      onClick={disabled ? undefined : onClick}
      disabled={disabled}
      title={disabled ? disabledTitle : 'Edit'}
      className={cn(
        "flex items-center gap-1.5 text-sm text-[#52525b] rounded-lg px-2 py-1 -mr-2 bg-transparent border-0 [font-family:'Inter',_ui-sans-serif,_system-ui,_sans-serif] font-medium",
        'transition-[background-color,color] duration-[120ms]',
        disabled ?
        'opacity-40 cursor-not-allowed' :
        'hover:bg-muted hover:text-foreground',
        className
      )}>
      
      <SquarePen className="w-4 h-4" strokeWidth={1.8} strokeLinecap="round" /> {label}
    </button>);

}