import React from 'react';
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer } from 'recharts';

import { compositionColors } from './compositionPalette';

/** Donut chart for one composition category — slices are the category's options. */
export default function CompositionDonut({ entries = [] }) {
  const items = entries.filter((e) => Number(e.value) > 0);
  // One distinct colour per slice, however many options the category has.
  const colors = compositionColors(items.length);

  if (entries.length === 0) {
    return <div className="h-24 flex items-center justify-center text-sm text-muted-foreground">No options defined yet.</div>;
  }

  if (items.length === 0) {
    return <div className="h-40 flex items-center justify-center text-sm text-muted-foreground">No members assigned yet.</div>;
  }

  return (
    <>
      <div className="h-52">
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie data={items} dataKey="value" nameKey="name" innerRadius={62} outerRadius={90} paddingAngle={2} strokeWidth={0}>
              {items.map((d, i) => <Cell key={d.id || i} fill={colors[i]} />)}
            </Pie>
            <Tooltip
              contentStyle={{ borderRadius: 8, border: '1px solid hsl(var(--border))', fontSize: 12, background: 'hsl(var(--popover))', color: 'hsl(var(--popover-foreground))' }}
            />
          </PieChart>
        </ResponsiveContainer>
      </div>
      <div className="flex flex-wrap justify-center gap-x-3 gap-y-1.5 mt-3">
        {items.map((d, i) => (
          <div key={d.id || d.name} className="flex items-center gap-1.5 min-w-0">
            <span className="w-2.5 h-2.5 rounded-full shrink-0" style={{ backgroundColor: colors[i] }} />
            <span className="text-xs text-muted-foreground truncate" title={d.name}>{d.name} ({d.value})</span>
          </div>
        ))}
      </div>
    </>
  );
}