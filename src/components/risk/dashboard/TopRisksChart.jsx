import React, { useState } from 'react';
import { ELEVATED_CARD } from '@/components/shared/cardStyles';
import ChartTooltipCard from './ChartTooltipCard';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell, LabelList } from 'recharts';
import { topRisks } from '@/lib/riskAnalytics';
import { RATING_COLORS } from '@/lib/riskAnalytics';
import RiskDrilldownPane from './RiskDrilldownPane';
import { RISK_CHART_ENTRY } from '@/lib/chartMotion';

// Risk title rendered tight beneath its own bar instead of on a left-side axis.
function RiskLabel({ x, y, height, value }) {
  return (
    <text x={x} y={y + height + 12} fill="hsl(var(--foreground))" fontSize={12} textAnchor="start">
      {value}
    </text>
  );
}

// Score bubble sitting just past the end of each bar.
function ScoreCircle({ x, y, width, height, value, index, data }) {
  const cx = x + width + 14;
  const cy = y + height / 2;
  const fill = RATING_COLORS[data[index]?.rating] || '#6366f1';
  return (
    <g>
      <circle cx={cx} cy={cy} r={11} fill={fill} />
      <text x={cx} y={cy} fill="#fff" fontSize={11} fontWeight={700} textAnchor="middle" dominantBaseline="central">
        {value}
      </text>
    </g>
  );
}

function CustomTooltip({ active, payload }) {
  if (!active || !payload?.length) return null;
  const d = payload[0].payload;
  return (
    <ChartTooltipCard title={d.title}>
      Risk score: <span className="font-semibold text-foreground">{d.score}</span>
      {d.rating ? ` · ${d.rating}` : ''}
    </ChartTooltipCard>);

}

export default function TopRisksChart({ risks = [] }) {
  const data = topRisks(risks, 5);
  const [selectedId, setSelectedId] = useState(null);
  const selectedRisks = selectedId ? risks.filter((r) => r.id === selectedId) : [];

  return (
    <div className={`${ELEVATED_CARD} chart-hover-lift p-5`}>
      <h3 className="text-lg font-bold text-foreground">Top 5 Risks</h3>
      <p className="text-xs text-muted-foreground mt-0.5">Highest scored risks</p>

      {data.length === 0 ?
      <p className="text-sm text-muted-foreground py-10 text-center">No scored risks yet.</p> :

      <div className="mt-4 h-[280px]">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart layout="vertical" data={data} barCategoryGap="35%" margin={{ left: 8, right: 40, top: 4, bottom: 20 }}>
              <XAxis
              type="number"
              domain={[0, 25]}
              ticks={[0, 5, 10, 15, 20, 25]}
              tick={{ fontSize: 11, fill: 'hsl(var(--muted-foreground))' }}
              tickLine={false}
              axisLine={{ stroke: 'hsl(var(--border))' }}
              tickMargin={6} />
              <YAxis type="category" dataKey="title" width={0} tick={false} tickLine={false} axisLine={false} padding={{ bottom: 24 }} />
            
              <Tooltip content={<CustomTooltip />} cursor={{ fill: 'hsl(var(--muted) / 0.4)' }} />
              <Bar
              dataKey="score"
              radius={[0, 4, 4, 0]}
              barSize={18}
              {...RISK_CHART_ENTRY}
              cursor="pointer"
              onClick={(d) => d?.id && setSelectedId(d.id)}>
              
                {data.map((d) =>
              <Cell key={d.id} fill={RATING_COLORS[d.rating] || '#6366f1'} />
              )}
                <LabelList dataKey="title" content={<RiskLabel />} />
                <LabelList dataKey="score" content={<ScoreCircle data={data} />} />
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      }
      <RiskDrilldownPane
        isOpen={!!selectedId}
        onClose={() => setSelectedId(null)}
        title="Top 5 Risks"
        subtitle="Highest scored risks"
        risks={selectedRisks} />
    </div>);

}