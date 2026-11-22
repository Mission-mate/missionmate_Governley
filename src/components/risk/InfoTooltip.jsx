import React, { useState } from 'react';
import { Info } from 'lucide-react';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';

/**
 * Info tooltip that opens on hover AND on click (toggle).
 * Works in both view and edit modes.
 */
export default function InfoTooltip({ text }) {
  const [open, setOpen] = useState(false);

  return (
    <TooltipProvider delayDuration={100}>
      <Tooltip open={open} onOpenChange={setOpen}>
        <TooltipTrigger asChild>
          <button
            type="button"
            onClick={(e) => {
              e.preventDefault();
              setOpen((o) => !o);
            }}
            className="text-muted-foreground/70 hover:text-foreground"
          >
            <Info className="w-3.5 h-3.5" />
          </button>
        </TooltipTrigger>
        <TooltipContent className="max-w-[240px] text-xs z-[200]">{text}</TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}