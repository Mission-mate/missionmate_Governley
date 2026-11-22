import React from 'react';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, LabelList } from 'recharts';
import ChartCard from './ChartCard';
import { formatCurrency } from '@/hooks/useGrantAnalytics';
import { CHART_ENTRY } from '@/lib/chartMotion';
import useStableChartData from '@/hooks/useStableChartData';

// Category name rendered tight beneath its own bar instead of on a left-side axis.
function CategoryLabel({ x, y, height, value }) {
  return (
    <text x={x} y={y + height + 12} fill="hsl(var(--foreground))" fontSize={12} textAnchor="start">
      {value}
    </text>
  );
}

export default function FundingByProviderChart({ data: rawData, title, subtitle, dataKey }) {
  const data = useStableChartData(rawData);
  if (!data.length) {
    return (
      <ChartCard title={title} subtitle={subtitle}>
        <div className="h-[260px] flex items-center justify-center text-sm text-muted-foreground">No data available.</div>
      </ChartCard>
    );
  }

  return (
    <ChartCard title={title} subtitle={subtitle}>
      <ResponsiveContainer width="100%" height={260}>
        <BarChart data={data} layout="vertical" barCategoryGap="35%" margin={{ top: 4, right: 12, left: 8, bottom: 0 }}>
          <defs>
            <linearGradient id="fundingBarGradient" x1="0" y1="0" x2="1" y2="0">
              <stop offset="0%" stopColor="#3b82f6" />
              <stop offset="100%" stopColor="#2dd4bf" />
            </linearGradient>
          </defs>
          <XAxis type="number" tickFormatter={formatCurrency} tick={{ fontSize: 11, fill: 'hsl(var(--muted-foreground))' }} axisLine={false} tickLine={false} />
          <YAxis type="category" dataKey={dataKey} width={0} tick={false} axisLine={false} tickLine={false} />
          <Tooltip
            cursor={{ fill: 'hsl(var(--muted))', opacity: 0.4 }}
            formatter={(value) => [formatCurrency(value), 'Funding']}
            contentStyle={{ borderRadius: 12, border: '1px solid hsl(var(--border))', fontSize: 13 }}
          />
          <Bar
            dataKey="amount"
            fill="url(#fundingBarGradient)"
            radius={[0, 6, 6, 0]}
            maxBarSize={18}
            {...CHART_ENTRY}
          >
            <LabelList dataKey={dataKey} content={<CategoryLabel />} />
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </ChartCard>
  );
}