import React from 'react';
import { cn } from '@/lib/utils';
import { Info } from 'lucide-react';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';

/** Label + either an edit control (children) or a read-only display value. */
export default function AssetField({ label, required, edit, display, hint, error, full, tooltip, children }) {
  const empty = display == null || display === '';
  return (
    <div className={cn('min-w-0', full && 'sm:col-span-2')}>
      <label className="text-xs font-semibold text-muted-foreground flex items-center gap-1 mb-1.5">
        <span>{label}{required && edit && <span className="text-destructive"> *</span>}</span>
        {tooltip && (
          <TooltipProvider delayDuration={150}>
            <Tooltip>
              <TooltipTrigger asChild>
                <Info className="w-3.5 h-3.5 text-muted-foreground/70 hover:text-foreground cursor-help" />
              </TooltipTrigger>
              <TooltipContent className="max-w-xs text-xs z-[10000]">{tooltip}</TooltipContent>
            </Tooltip>
          </TooltipProvider>
        )}
      </label>
      {edit && children ? children : (
        <div className="text-sm text-foreground min-h-[20px] whitespace-pre-wrap break-words">
          {empty ? <span className="text-muted-foreground">—</span> : display}
        </div>
      )}
      {hint && <p className="text-[11px] text-muted-foreground mt-1">{hint}</p>}
      {error && <p className="text-xs text-destructive mt-1">{error}</p>}
    </div>
  );
}