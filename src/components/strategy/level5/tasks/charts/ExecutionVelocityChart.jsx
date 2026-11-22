import React, { useState } from 'react';
import { ResponsiveContainer, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend } from 'recharts';
import TaskChartCard from './TaskChartCard';
import ChartPeriodTabs from './ChartPeriodTabs';
import { periodVelocityData } from './taskChartData';

/** Cumulative planned vs completed delivery — widening gap signals slippage. */
export default function ExecutionVelocityChart({ tasks, onDrilldown }) {
  const [period, setPeriod] = useState('quarter');
  const data = periodVelocityData(tasks, period);
  const handleChartClick = (e) => {
    const point = e?.activePayload?.[0]?.payload;
    if (point) onDrilldown?.('Execution Velocity Gap', point.label, point.bucketKey, period);
  };
  return (
    <TaskChartCard
      title="Execution Velocity"
      subtitle="Cumulative planned vs completed items over time"
      actions={<ChartPeriodTabs value={period} onChange={setPeriod} />}
    >
      {data.length === 0 ? (
        <div className="h-[280px] flex items-center justify-center text-sm text-muted-foreground">No dated items to chart</div>
      ) : (
        <ResponsiveContainer width="100%" height={320}>
          <LineChart data={data} margin={{ top: 5, right: 10, left: -20, bottom: 0 }} onClick={handleChartClick} className="cursor-pointer">
            <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" vertical={false} />
            <XAxis dataKey="label" tick={{ fontSize: 11, angle: -45, textAnchor: 'end' }} height={60} tickMargin={8} interval={0} stroke="hsl(var(--muted-foreground))" />
            <YAxis tick={{ fontSize: 11 }} stroke="hsl(var(--muted-foreground))" allowDecimals={false} />
            <Tooltip contentStyle={{ fontSize: 12, borderRadius: 8 }} />
            <Legend wrapperStyle={{ fontSize: 12, paddingTop: 8 }} />
            <Line type="monotone" dataKey="planned" name="Planned" stroke="#94a3b8" strokeWidth={2} dot={false} activeDot={{ r: 5 }} />
            <Line type="monotone" dataKey="completed" name="Completed" stroke="#10b981" strokeWidth={2} dot={false} activeDot={{ r: 5 }} />
          </LineChart>
        </ResponsiveContainer>
      )}
    </TaskChartCard>
  );
}