import React, { useState } from 'react';
import { ELEVATED_CARD } from '@/components/shared/cardStyles';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend } from 'recharts';
import { PieCountTooltip } from './ChartTooltipCard';
import { ratingDistribution } from '@/lib/riskAnalytics';
import RiskDrilldownPane from './RiskDrilldownPane';
import DonutCountLegend from './DonutCountLegend';
import { RISK_CHART_ENTRY } from '@/lib/chartMotion';

export default function RatingPieChart({ risks }) {
  const data = ratingDistribution(risks);
  const [band, setBand] = useState(null);
  const bandRisks = band ? (risks || []).filter((r) => r.residual_rating === band) : [];

  return (
    <div className={`${ELEVATED_CARD} chart-hover-lift p-5`}>
      <h3 className="text-lg font-bold text-foreground mb-1">Residual Risk Rating</h3>
      <p className="text-xs text-muted-foreground mb-4">Distribution of risks by current rating band</p>
      {data.length === 0 ? (
        <div className="h-64 flex items-center justify-center text-sm text-muted-foreground">No rated risks yet</div>
      ) : (
        <ResponsiveContainer width="100%" height={260}>
          <PieChart>
            <Pie
              data={data}
              dataKey="value"
              nameKey="name"
              cx="38%"
              cy="50%"
              outerRadius={105}
              innerRadius={67}
              paddingAngle={2}
              {...RISK_CHART_ENTRY}
              className="cursor-pointer"
              onClick={(d) => d?.name && setBand(d.name)}
            >
              {data.map((d) => (
                <Cell key={d.name} fill={d.color} />
              ))}
            </Pie>
            <Tooltip content={<PieCountTooltip />} />
            <Legend
              layout="vertical"
              align="right"
              verticalAlign="middle"
              content={<DonutCountLegend data={data} />}
            />
          </PieChart>
        </ResponsiveContainer>
      )}
      <RiskDrilldownPane
        isOpen={!!band}
        onClose={() => setBand(null)}
        title="Residual Risk Rating"
        subtitle={band ? `Rating band: ${band}` : ''}
        risks={bandRisks}
      />
    </div>
  );
}