import React from 'react';
import { cn } from '@/lib/utils';

/** Card shell for a task analytics chart. */
export default function TaskChartCard({ title, subtitle, className, actions, children }) {
  return (
    <div className={cn('bg-card border border-border rounded-xl p-5', className)}>
      <div className="mb-4 flex items-start justify-between gap-3">
        <div>
          <h3 className="text-sm font-semibold text-foreground">{title}</h3>
          {subtitle && <p className="text-xs text-muted-foreground mt-0.5">{subtitle}</p>}
        </div>
        {actions}
      </div>
      {children}
    </div>
  );
}