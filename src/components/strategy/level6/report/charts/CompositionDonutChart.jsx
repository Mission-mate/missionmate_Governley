import React from 'react';
import { ResponsiveContainer, PieChart, Pie, Cell, Tooltip, Legend } from 'recharts';
import ChartCard from './ChartCard';
import { CHART_COLORS, fmtNum } from './chartData';

function DonutTooltip({ active, payload }) {
  if (!active || !payload?.length) return null;
  const d = payload[0].payload;
  return (
    <div className="bg-card border border-border rounded-lg shadow-lg px-3.5 py-2.5 text-sm">
      <p className="font-semibold text-foreground mb-1">{d.name}</p>
      <p className="text-muted-foreground">Actual : <span className="font-medium">{fmtNum(d.value)}</span></p>
      <p className="text-muted-foreground">Share : <span className="font-medium">{d.share}%</span></p>
    </div>
  );
}

function DonutLegend({ payload }) {
  return (
    <div className="flex flex-wrap items-center justify-center gap-x-4 gap-y-1 pt-1">
      {(payload || []).map((e) => (
        <span key={e.value} className="inline-flex items-center gap-1.5 text-xs text-muted-foreground">
          <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: e.color }} />
          {e.value}
        </span>
      ))}
    </div>
  );
}

/** Share of total actuals — which periods or categories contribute the most. */
export default function CompositionDonutChart({ data }) {
  if (!data.length) return null;
  const total = data.reduce((s, d) => s + d.value, 0);
  return (
    <ChartCard title="Contribution Mix" description="Share of the total actual results">
      <ResponsiveContainer width="100%" height="100%">
        <PieChart>
          <Pie
            data={data}
            dataKey="value"
            nameKey="name"
            innerRadius="55%"
            outerRadius="80%"
            paddingAngle={2}
            animationDuration={800}
          >
            {data.map((d, i) => (
              <Cell key={d.name} fill={CHART_COLORS[i % CHART_COLORS.length]} stroke="hsl(var(--card))" strokeWidth={2} />
            ))}
          </Pie>
          <Tooltip content={<DonutTooltip />} />
          <Legend verticalAlign="bottom" content={<DonutLegend />} />
          <text x="50%" y="44%" textAnchor="middle" className="fill-foreground" style={{ fontSize: 18, fontWeight: 600 }}>
            {fmtNum(total)}
          </text>
          <text x="50%" y="53%" textAnchor="middle" className="fill-muted-foreground" style={{ fontSize: 11 }}>
            Total actual
          </text>
        </PieChart>
      </ResponsiveContainer>
    </ChartCard>
  );
}