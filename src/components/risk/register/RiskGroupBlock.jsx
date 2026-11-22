import React from 'react';
import { cn } from '@/lib/utils';
import { RISK_TABLE } from '@/components/risk/riskSurfaces';

/** Grouped risk table section — label + count pill above the outlined table container. */
export default function RiskGroupBlock({ label, count, children }) {
  return (
    <section>
      <div className="flex items-center gap-2 mb-2">
        <h3 className="text-sm font-semibold text-foreground">{label}</h3>
        <span className="text-xs text-muted-foreground bg-muted rounded-full px-2 py-0.5">{count}</span>
      </div>
      <div className={cn(RISK_TABLE, 'overflow-x-auto')}>{children}</div>
    </section>
  );
}