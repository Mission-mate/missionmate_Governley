import React from 'react';
import { ResponsiveContainer, BarChart, Bar, Cell, XAxis, YAxis, Tooltip, ReferenceLine, CartesianGrid } from 'recharts';
import ChartCard from './ChartCard';
import ChartTooltipBox from './ChartTooltipBox';
import { POSITIVE_COLOR, NEGATIVE_COLOR } from './chartData';

/** Over/under performance against expected, per row. */
export default function VarianceChart({ series, direction = 'Higher is Better' }) {
  const data = series.filter((s) => s.variance != null).map((s) => ({ name: s.name, Variance: s.variance }));
  if (data.length === 0) return null;
  // Bar direction always follows the sign; colour follows the desired direction.
  const isGood = (v) => (direction === 'Lower is Better' ? v < 0 : v >= 0);
  return (
    <ChartCard
      title="Variance to Target"
      description="Gap between actual and expected — above the line is ahead, below is behind."
    >
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={data} margin={{ top: 8, right: 16, left: 0, bottom: 0 }} barCategoryGap="30%">
          <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" vertical={false} />
          <XAxis dataKey="name" tickLine={false} axisLine={false} tick={{ fontSize: 11, fill: 'hsl(var(--muted-foreground))' }} interval="preserveStartEnd" />
          <YAxis tickLine={false} axisLine={false} width={48} tick={{ fontSize: 11, fill: 'hsl(var(--muted-foreground))' }} tickFormatter={(v) => Number(v).toLocaleString()} />
          <Tooltip content={<ChartTooltipBox />} cursor={{ fill: 'hsl(var(--muted))', opacity: 0.4 }} />
          <ReferenceLine y={0} stroke="hsl(var(--border))" />
          <Bar dataKey="Variance" radius={[4, 4, 0, 0]} animationDuration={800}>
            {data.map((d, i) => (
              <Cell key={i} fill={isGood(d.Variance) ? POSITIVE_COLOR : NEGATIVE_COLOR} />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </ChartCard>
  );
}