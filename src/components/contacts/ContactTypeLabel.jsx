/**
 * Contact Type field label with an info-icon hover tooltip pointing users to
 * where additional contact types are configured.
 */
import React from 'react';
import { Info } from 'lucide-react';
import { Label } from '@/components/ui/label';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';

export default function ContactTypeLabel() {
  return (
    <Label className="mb-1.5 flex items-center gap-1.5 text-sm">
      <span>
        Contact Type <span className="text-red-500">*</span>
      </span>
      <TooltipProvider delayDuration={150}>
        <Tooltip>
          <TooltipTrigger asChild>
            <span className="inline-flex cursor-help text-muted-foreground hover:text-foreground transition-colors">
              <Info className="h-3.5 w-3.5" />
            </span>
          </TooltipTrigger>
          <TooltipContent side="top" className="z-[110] max-w-[240px]">
            Configure additional contact types in custom field settings
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>
    </Label>
  );
}