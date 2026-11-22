import React from 'react';
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, CartesianGrid, Cell, ReferenceLine } from 'recharts';
import ChartCard from './ChartCard';
import ChartTooltipBox from './ChartTooltipBox';
import { POSITIVE_COLOR, EXPECTED_COLOR } from './chartData';

/** Horizontal achievement view — actual as a % of expected, per row. */
export default function ProgressBulletChart({ series }) {
  const data = series
    .filter((s) => s.expected != null && s.expected !== 0 && s.actual != null)
    .map((s) => ({ name: s.name, 'Achievement %': Math.round((s.actual / s.expected) * 1000) / 10 }));
  if (data.length === 0) return null;
  return (
    <ChartCard
      title="Achievement Against Target"
      description="Actual as a percentage of expected — 100% means on target."
      height={data.length > 6 ? 'h-96' : data.length > 3 ? 'h-72' : 'h-56'}
    >
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={data} layout="vertical" margin={{ top: 8, right: 24, left: 8, bottom: 0 }} barCategoryGap="30%">
          <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" horizontal={false} />
          <XAxis type="number" tickLine={false} axisLine={false} tick={{ fontSize: 11, fill: 'hsl(var(--muted-foreground))' }} tickFormatter={(v) => `${v}%`} />
          <YAxis type="category" dataKey="name" width={110} tickLine={false} axisLine={false} tick={{ fontSize: 11, fill: 'hsl(var(--muted-foreground))' }} />
          <Tooltip content={<ChartTooltipBox suffix="%" />} cursor={{ fill: 'hsl(var(--muted))', opacity: 0.4 }} />
          <ReferenceLine x={100} stroke={EXPECTED_COLOR} strokeDasharray="4 4" />
          <Bar dataKey="Achievement %" radius={[0, 4, 4, 0]} animationDuration={800}>
            {data.map((d, i) => (
              <Cell key={i} fill={d['Achievement %'] >= 100 ? POSITIVE_COLOR : '#3b82f6'} />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </ChartCard>
  );
}