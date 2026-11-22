import React from 'react';
import { fmtNum } from './chartData';

/** Generic tooltip box listing each series value for the hovered point. */
export default function ChartTooltipBox({ active, payload, label, suffix = '' }) {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-card border border-border rounded-lg shadow-lg px-3.5 py-2.5 text-sm">
      <p className="font-semibold text-foreground mb-1">{label ?? payload[0]?.name}</p>
      {payload.map((p) => (
        <p key={p.dataKey || p.name} style={{ color: p.color || p.payload?.fill }}>
          {p.name} : <span className="font-medium">{fmtNum(p.value)}{suffix}</span>
        </p>
      ))}
    </div>
  );
}