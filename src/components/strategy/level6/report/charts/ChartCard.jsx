import React from 'react';
import { ELEVATED_SECTION } from '@/components/shared/cardStyles';

/** Consistent card shell for a Data Visualisation chart. */
export default function ChartCard({ title, description, children, height = 'h-64' }) {
  return (
    <div className={ELEVATED_SECTION} data-chart-card data-chart-title={title}>
      <div className="mb-3">
        <h4 className="text-sm font-semibold text-foreground">{title}</h4>
        {description && <p className="text-xs text-muted-foreground mt-0.5">{description}</p>}
      </div>
      <div className={height}>{children}</div>
    </div>
  );
}