import React, { useState } from 'react';
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend } from 'recharts';
import TaskChartCard from './TaskChartCard';
import ChartPeriodTabs from './ChartPeriodTabs';
import { periodBarData } from './taskChartData';

/** Planned vs completed activities per period, drawn as overlapping bars. */
export default function QuarterlyBarChart({ tasks, onDrilldown }) {
  const [period, setPeriod] = useState('quarter');
  const data = periodBarData(tasks, period);
  const handleClick = (payload, key) => {
    const p = payload?.payload;
    if (p) onDrilldown?.('Activity Plan vs Completion', p.label, p.bucketKey, key, period);
  };
  return (
    <TaskChartCard
      title="Activity Plan vs Completion"
      subtitle="Planned and completed activities per period"
      actions={<ChartPeriodTabs value={period} onChange={setPeriod} />}
    >
      {data.length === 0 ? (
        <div className="h-[280px] flex items-center justify-center text-sm text-muted-foreground">No dated items to chart</div>
      ) : (
        <ResponsiveContainer width="100%" height={320}>
          <BarChart data={data} margin={{ top: 5, right: 10, left: -20, bottom: 0 }} barGap={-28}>
            <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" vertical={false} />
            <XAxis dataKey="label" tick={{ fontSize: 11, angle: -45, textAnchor: 'end' }} height={60} tickMargin={8} interval={0} stroke="hsl(var(--muted-foreground))" />
            <YAxis tick={{ fontSize: 11 }} stroke="hsl(var(--muted-foreground))" allowDecimals={false} />
            <Tooltip contentStyle={{ fontSize: 12, borderRadius: 8 }} cursor={{ fill: 'hsl(var(--muted))', opacity: 0.4 }} />
            <Legend wrapperStyle={{ fontSize: 12, paddingTop: 8 }} />
            <Bar dataKey="planned" name="Planned" fill="#94a3b8" barSize={28} radius={[4, 4, 0, 0]} className="cursor-pointer" onClick={(p) => handleClick(p, 'planned')} />
            <Bar dataKey="completed" name="Completed" fill="#10b981" barSize={18} radius={[4, 4, 0, 0]} className="cursor-pointer" onClick={(p) => handleClick(p, 'completed')} />
          </BarChart>
        </ResponsiveContainer>
      )}
    </TaskChartCard>
  );
}