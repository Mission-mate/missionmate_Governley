import React from 'react';
import { Label } from '@/components/ui/label';
import InfoTooltip from '@/components/risk/InfoTooltip';
import { cn } from '@/lib/utils';

/** Field label for the Log New Risk pane — matches the Add Compliance Obligation pane labels. */
export default function LogRiskFieldLabel({ children, required, tooltip, error }) {
  return (
    <Label className={cn('mb-1.5 flex items-center gap-1.5 text-xs font-medium', error ? 'text-destructive' : 'text-muted-foreground')}>
      <span>
        {children}{required && <span className="text-destructive"> *</span>}
      </span>
      {tooltip && <InfoTooltip text={tooltip} />}
    </Label>
  );
}