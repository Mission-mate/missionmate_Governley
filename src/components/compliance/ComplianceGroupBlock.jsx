import React from 'react';
import { cn } from '@/lib/utils';
import { COMPLIANCE_TABLE } from './complianceSurfaces';

/** Grouped table section for Compliance — same as the shared block but with the dark elevated surface. */
export default function ComplianceGroupBlock({ label, count, children }) {
  return (
    <section>
      <div className="flex items-center gap-2 mb-2">
        <h3 className="text-sm font-semibold text-foreground">{label}</h3>
        <span className="text-xs text-muted-foreground bg-muted rounded-full px-2 py-0.5">{count}</span>
      </div>
      <div className={cn(COMPLIANCE_TABLE, 'overflow-x-auto')}>{children}</div>
    </section>
  );
}