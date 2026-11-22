import React from 'react';
import { ELEVATED_CARD } from '@/components/shared/cardStyles';

function Tile({ label, value, sub, accent }) {
  return (
    <div className={`${ELEVATED_CARD} p-4`}>
      <p className={`text-2xl font-bold ${accent || 'text-foreground'}`}>{value}</p>
      <p className="text-xs font-medium text-muted-foreground mt-1">{label}</p>
      {sub && <p className="text-[11px] text-muted-foreground/70 mt-0.5">{sub}</p>}
    </div>
  );
}

export default function ReportMetrics({ metrics }) {
  if (!metrics) return null;
  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
      <Tile label="Total Risks" value={metrics.total ?? 0} sub={`${metrics.active ?? 0} active · ${metrics.closed ?? 0} closed`} accent="text-primary" />
      <Tile label="Outside Appetite" value={metrics.outsideAppetite ?? 0} sub="require board attention" accent={metrics.outsideAppetite > 0 ? 'text-red-600' : 'text-green-600'} />
      <Tile label="Risk Reduction" value={`${metrics.riskReduction ?? 0}%`} sub="inherent → residual" accent="text-foreground" />
      <Tile label="Action Completion" value={`${metrics.actionCompletionRate ?? 0}%`} sub={`${metrics.actionsOverdue ?? 0} overdue`} accent={metrics.actionsOverdue > 0 ? 'text-amber-600' : 'text-foreground'} />
    </div>
  );
}