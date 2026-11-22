import React from 'react';
import { ResponsiveContainer, ComposedChart, BarChart, Bar, Area, Line, XAxis, YAxis, Tooltip, Legend } from 'recharts';
import { buildChartSeries, buildComposition } from './charts/chartData';
import ChartCard from './charts/ChartCard';
import CumulativeTrendChart from './charts/CumulativeTrendChart';
import VarianceChart from './charts/VarianceChart';
import CompositionDonutChart from './charts/CompositionDonutChart';
import ProgressBulletChart from './charts/ProgressBulletChart';

const EXPECTED_COLOR = '#94a3b8'; // slate-400
const ACTUAL_COLOR = '#10b981'; // emerald-500
const BASELINE_COLOR = EXPECTED_COLOR; // matches the Expected grey

const fmt = (v) => (v == null ? '—' : Number(v).toLocaleString());

function ChartTooltip({ active, payload, label }) {
  if (!active || !payload?.length) return null;
  const d = payload[0]?.payload || {};
  return (
    <div className="bg-card border border-border rounded-lg shadow-lg px-3.5 py-2.5 text-sm">
      <p className="font-semibold text-foreground mb-1">{label}</p>
      {d.baseline != null && (
        <p style={{ color: BASELINE_COLOR }}>
          Baseline : <span className="font-medium">{fmt(d.baseline)}</span>
        </p>
      )}
      <p className="text-muted-foreground">
        Expected : <span className="font-medium">{fmt(d.expected)}</span>
      </p>
      <p style={{ color: ACTUAL_COLOR }}>
        Actual : <span className="font-medium">{fmt(d.actual)}</span>
      </p>
    </div>
  );
}

function LegendContent({ payload }) {
  return (
    <div className="flex items-center justify-center gap-5 pb-1">
      {(payload || []).map((entry) => (
        <span key={entry.value} className="inline-flex items-center gap-1.5 text-xs text-muted-foreground">
          {entry.value === 'Baseline' ? (
            <span
              className="w-4 h-0 border-t-2 border-dashed"
              style={{ borderColor: entry.color }}
            />
          ) : (
            <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: entry.color }} />
          )}
          {entry.value}
        </span>
      ))}
    </div>
  );
}

/**
 * Expected vs Actual chart for a Level 6 reporting table.
 * variant 'line' — sequential/timeline data (reporting periods on X axis).
 * variant 'bar'  — categorical comparison (locations on X axis, side-by-side bars).
 */
function MainChart({ nodes, variant = 'line', showBaseline = true }) {
  const data = (nodes || []).map((n) => ({
    name: n.label || '—',
    expected: n.display?.expected ?? null,
    actual: n.display?.actual ?? null,
    baseline: n.display?.baseline ?? null,
  }));
  // Baseline only appears once it's shown in the table and has values recorded.
  const hasBaseline = showBaseline && data.some((d) => d.baseline != null);

  const axes = (
    <>
      <XAxis
        dataKey="name"
        tickLine={false}
        axisLine={false}
        tick={{ fontSize: 11, fill: 'hsl(var(--muted-foreground))' }}
        interval="preserveStartEnd"
      />
      <YAxis
        tickLine={false}
        axisLine={false}
        width={48}
        tick={{ fontSize: 11, fill: 'hsl(var(--muted-foreground))' }}
        tickFormatter={(v) => Number(v).toLocaleString()}
      />
      <Legend verticalAlign="top" content={<LegendContent />} />
    </>
  );

  if (variant === 'bar') {
    return (
      <ChartCard
        title="Expected vs Actual by Category"
        description="Side-by-side comparison of expected and actual results for each category."
        height="h-72"
      >
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={data} margin={{ top: 8, right: 16, left: 0, bottom: 0 }} barGap={6} barCategoryGap="28%">
            {axes}
            <Tooltip content={<ChartTooltip />} cursor={{ fill: 'hsl(var(--muted))', opacity: 0.4 }} />
            <Bar
              dataKey="expected"
              name="Expected"
              fill={EXPECTED_COLOR}
              radius={[4, 4, 0, 0]}
              animationDuration={900}
              animationEasing="ease-out"
            />
            <Bar
              dataKey="actual"
              name="Actual"
              fill={ACTUAL_COLOR}
              radius={[4, 4, 0, 0]}
              animationDuration={900}
              animationEasing="ease-out"
            />
          </BarChart>
        </ResponsiveContainer>
      </ChartCard>
    );
  }

  return (
    <ChartCard
      title="Expected vs Actual Over Time"
      description="Performance across each reporting period, showing how actuals track against expected."
      height="h-72"
    >
      <ResponsiveContainer width="100%" height="100%">
        <ComposedChart data={data} margin={{ top: 8, right: 16, left: 0, bottom: 0 }}>
          <defs>
            <linearGradient id="l6Expected" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor={EXPECTED_COLOR} stopOpacity={0.28} />
              <stop offset="100%" stopColor={EXPECTED_COLOR} stopOpacity={0.02} />
            </linearGradient>
            <linearGradient id="l6Actual" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor={ACTUAL_COLOR} stopOpacity={0.28} />
              <stop offset="100%" stopColor={ACTUAL_COLOR} stopOpacity={0.02} />
            </linearGradient>
          </defs>
          {axes}
          <Tooltip content={<ChartTooltip />} cursor={{ stroke: 'hsl(var(--border))', strokeDasharray: '4 4' }} />
          <Area
            type="monotone"
            dataKey="expected"
            name="Expected"
            stroke={EXPECTED_COLOR}
            strokeWidth={2}
            fill="url(#l6Expected)"
            dot={{ r: 3.5, stroke: EXPECTED_COLOR, strokeWidth: 1.5, fill: '#fff' }}
            activeDot={{ r: 5 }}
            connectNulls
            animationDuration={900}
            animationEasing="ease-out"
          />
          <Area
            type="monotone"
            dataKey="actual"
            name="Actual"
            stroke={ACTUAL_COLOR}
            strokeWidth={2}
            fill="url(#l6Actual)"
            dot={{ r: 3.5, stroke: ACTUAL_COLOR, strokeWidth: 1.5, fill: '#fff' }}
            activeDot={{ r: 5 }}
            connectNulls
            animationDuration={900}
            animationEasing="ease-out"
          />
          {hasBaseline && (
            <Line
              type="monotone"
              dataKey="baseline"
              name="Baseline"
              stroke={BASELINE_COLOR}
              strokeWidth={2}
              strokeDasharray="5 4"
              dot={{ r: 3, stroke: BASELINE_COLOR, strokeWidth: 1.5, fill: '#fff' }}
              activeDot={{ r: 5 }}
              connectNulls
              animationDuration={900}
              animationEasing="ease-out"
            />
          )}
        </ComposedChart>
      </ResponsiveContainer>
    </ChartCard>
  );
}

/**
 * Data Visualisation view — the main Expected vs Actual chart plus a set of
 * insight charts (trend, variance, composition and achievement).
 */
export default function Level6ReportChart({ nodes, variant = 'line', direction, showBaseline = true }) {
  const series = buildChartSeries(nodes);
  const composition = buildComposition(series);

  if (series.length === 0) {
    return (
      <div className="border border-border rounded-lg bg-card py-10 text-center text-sm text-muted-foreground">
        No reporting data to chart yet. Add a reporting period to get started.
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <MainChart nodes={nodes} variant={variant} showBaseline={showBaseline} />
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {variant === 'line' && <CumulativeTrendChart series={series} />}
        <VarianceChart series={series} direction={direction} />
        <CompositionDonutChart data={composition} />
        <ProgressBulletChart series={series} />
      </div>
    </div>
  );
}