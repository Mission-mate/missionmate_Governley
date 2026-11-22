import React from 'react';
import { Label } from '@/components/ui/label';
import InfoTooltip from '@/components/risk/InfoTooltip';
import { cn } from '@/lib/utils';

export default function RpField({ label, required, tip, className, children }) {
  return (
    <div className={cn('space-y-1.5', className)}>
      <Label className="text-xs font-semibold text-muted-foreground flex items-center gap-1">
        <span>{label}{required && <span className="text-destructive"> *</span>}</span>
        {tip && <InfoTooltip text={tip} />}
      </Label>
      {children}
    </div>
  );
}