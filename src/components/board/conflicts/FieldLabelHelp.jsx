import React from 'react';
import { Info } from 'lucide-react';
import { Tooltip, TooltipTrigger, TooltipContent, TooltipProvider } from '@/components/ui/tooltip';

/**
 * Field label with an optional info tooltip, shared by the Conflict of Interest
 * view / edit / add panes. Matches the Membership card's label + help pattern.
 */
export default function FieldLabelHelp({ label, help, required, className = '' }) {
  return (
    <TooltipProvider delayDuration={200}>
      <p className={`text-xs font-medium text-muted-foreground mb-1 flex items-center gap-1 ${className}`}>
        {label}
        {required && <span className="text-destructive">*</span>}
        {help && (
          <Tooltip>
            <TooltipTrigger asChild>
              <button type="button" className="text-muted-foreground/70 hover:text-foreground">
                <Info className="w-3 h-3" />
              </button>
            </TooltipTrigger>
            <TooltipContent className="max-w-[240px] z-[200]">{help}</TooltipContent>
          </Tooltip>
        )}
      </p>
    </TooltipProvider>
  );
}