import React from 'react';
import { Info } from 'lucide-react';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';

/** Small info icon shown beside an Owner label explaining multi-owner support. */
export default function OwnerLabelHint() {
  return (
    <TooltipProvider delayDuration={150}>
      <Tooltip>
        <TooltipTrigger asChild>
          <span className="inline-flex items-center text-muted-foreground cursor-help">
            <Info className="w-3.5 h-3.5" />
          </span>
        </TooltipTrigger>
        <TooltipContent side="top" className="max-w-[220px] z-[200]">
          Multiple owners can be assigned
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}