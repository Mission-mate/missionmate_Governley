import React from 'react';
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer } from 'recharts';
import ChartCard from './ChartCard';
import { CHART_ENTRY } from '@/lib/chartMotion';
import useStableChartData from '@/hooks/useStableChartData';

const PALETTE = [
  'hsl(var(--chart-1))',
  'hsl(var(--chart-2))',
  'hsl(var(--chart-4))',
  'hsl(var(--chart-5))',
  'hsl(var(--chart-3))',
  'hsl(216 30% 70%)',
];

// Roughly the number of legend chips that fit on two wrapped lines.
const LEGEND_LINE_LIMIT = 6;

const toInitials = (name) =>
  String(name || '')
    .split(/\s+/)
    .filter(Boolean)
    .map((w) => w[0])
    .join('')
    .toUpperCase();

export default function GrantDonutChart({ title, subtitle, data, centerLabel, formatTooltipValue }) {
  const items = useStableChartData((data || []).filter((d) => Number(d.value) > 0));
  const fmt = formatTooltipValue || ((v) => v);
  const useInitials = items.length > LEGEND_LINE_LIMIT;

  return (
    <ChartCard title={title} subtitle={subtitle}>
      {items.length === 0 ? (
        <div className="h-64 flex items-center justify-center text-sm text-muted-foreground">
          No data to display yet
        </div>
      ) : (
        <>
          <div className="relative h-52">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={items}
                  dataKey="value"
                  nameKey="name"
                  innerRadius={62}
                  outerRadius={90}
                  paddingAngle={2}
                  strokeWidth={0}
                  {...CHART_ENTRY}
                >
                  {items.map((d, i) => (
                    <Cell key={i} fill={d.color || PALETTE[i % PALETTE.length]} />
                  ))}
                </Pie>
                <Tooltip
                  formatter={(v, name) => [fmt(v), name]}
                  contentStyle={{
                    borderRadius: 8,
                    border: '1px solid hsl(var(--border))',
                    fontSize: 12,
                    boxShadow: '0 4px 12px rgba(16,24,40,0.08)',
                  }}
                />
              </PieChart>
            </ResponsiveContainer>
            {/* Centre summary value */}
            <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
              <span className="text-lg font-bold text-foreground">{centerLabel}</span>
            </div>
          </div>

          {/* Legend */}
          <div className="flex flex-wrap justify-center gap-x-4 gap-y-1.5 mt-4">
            {items.map((d, i) => (
              <div key={d.name} className="flex items-center gap-1.5 min-w-0">
                <span
                  className="w-2.5 h-2.5 rounded-full shrink-0"
                  style={{ backgroundColor: d.color || PALETTE[i % PALETTE.length] }}
                />
                <span className="text-xs text-muted-foreground truncate" title={d.name}>
                  {useInitials ? toInitials(d.name) : d.name}
                </span>
              </div>
            ))}
          </div>
        </>
      )}
    </ChartCard>
  );
}