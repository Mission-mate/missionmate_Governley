import React from 'react';

/** Soft rounded hover card shared by the Risk Dashboard charts. */
export const TOOLTIP_CARD = 'bg-popover border border-border rounded-lg shadow-lg px-3 py-2';

export default function ChartTooltipCard({ title, children }) {
  return (
    <div className={TOOLTIP_CARD}>
      <p className="text-xs font-semibold text-foreground">{title}</p>
      <p className="text-xs text-muted-foreground mt-0.5">{children}</p>
    </div>
  );
}

/** Recharts pie tooltip: "<name>" / "N risks". */
export function PieCountTooltip({ active, payload }) {
  if (!active || !payload?.length) return null;
  const { name, value } = payload[0];
  return (
    <ChartTooltipCard title={name}>
      <span className="font-semibold text-foreground">{value}</span> risk{value === 1 ? '' : 's'}
    </ChartTooltipCard>
  );
}