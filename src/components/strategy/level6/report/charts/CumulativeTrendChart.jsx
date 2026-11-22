import React from 'react';
import { ResponsiveContainer, AreaChart, Area, XAxis, YAxis, Tooltip, CartesianGrid } from 'recharts';
import ChartCard from './ChartCard';
import ChartTooltipBox from './ChartTooltipBox';
import { EXPECTED_COLOR, ACTUAL_COLOR } from './chartData';

/** Cumulative (year-to-date) build-up of actuals against the expected run rate. */
export default function CumulativeTrendChart({ series }) {
  const data = series.map((s) => ({ name: s.name, 'Cumulative Actual': s.ytd, 'Cumulative Expected': s.expectedYtd }));
  return (
    <ChartCard
      title="Cumulative Progress"
      description="How actuals build up over time against the expected run rate."
    >
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart data={data} margin={{ top: 8, right: 16, left: 0, bottom: 0 }}>
          <defs>
            <linearGradient id="l6CumActual" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor={ACTUAL_COLOR} stopOpacity={0.3} />
              <stop offset="100%" stopColor={ACTUAL_COLOR} stopOpacity={0.02} />
            </linearGradient>
          </defs>
          <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" vertical={false} />
          <XAxis dataKey="name" tickLine={false} axisLine={false} tick={{ fontSize: 11, fill: 'hsl(var(--muted-foreground))' }} interval="preserveStartEnd" />
          <YAxis tickLine={false} axisLine={false} width={48} tick={{ fontSize: 11, fill: 'hsl(var(--muted-foreground))' }} tickFormatter={(v) => Number(v).toLocaleString()} />
          <Tooltip content={<ChartTooltipBox />} />
          <Area type="monotone" dataKey="Cumulative Expected" stroke={EXPECTED_COLOR} strokeWidth={2} strokeDasharray="5 4" fill="none" connectNulls />
          <Area type="monotone" dataKey="Cumulative Actual" stroke={ACTUAL_COLOR} strokeWidth={2} fill="url(#l6CumActual)" connectNulls />
        </AreaChart>
      </ResponsiveContainer>
    </ChartCard>
  );
}