import React from 'react';
import ReportMetricTiles from './ReportMetricTiles';
import ReportSectionBlock from './ReportSectionBlock';
import MeasuresTable from './MeasuresTable';
import { reportSections } from '@/lib/strategy/statusReportSections';

function LayerTable({ layers }) {
  if (!layers?.length) return null;
  return (
    <div className="rounded-xl border border-border overflow-hidden">
      <div className="grid grid-cols-[1.6fr_repeat(4,0.8fr)] gap-2 px-3.5 py-2 bg-secondary/40 border-b border-border text-xs font-semibold text-foreground/80 uppercase tracking-wide items-center">
        <span>Layer</span><span>Items</span><span>Completed</span><span>Avg Progress</span><span>Off Track</span>
      </div>
      {layers.map((layer) => (
        <div key={layer.key} className="grid grid-cols-[1.6fr_repeat(4,0.8fr)] gap-2 px-3.5 py-2.5 border-b border-border last:border-0 text-[13px]">
          <span className="font-semibold text-foreground">{layer.name}</span>
          <span className="text-muted-foreground">{layer.total}</span>
          <span className="text-muted-foreground">{layer.completed} ({layer.completion_rate}%)</span>
          <span className="text-muted-foreground">{layer.avg_progress}%</span>
          <span className="text-muted-foreground">{layer.health?.['Off Track'] ?? 0}</span>
        </div>
      ))}
    </div>
  );
}

/** Renders a generated or saved status report: metrics snapshot + narrative sections. */
export default function StrategyReportBody({ report, compact = false }) {
  const metrics = report?.metrics || {};
  const narrative = report?.narrative || {};
  const sections = reportSections(report);

  return (
    <div className="space-y-6">
      <ReportMetricTiles metrics={metrics} compact={compact} />
      {!compact && <LayerTable layers={metrics.layers} />}
      {!compact && <MeasuresTable measures={metrics.measures} />}
      <div className="space-y-6">
        {sections.map((section) => (
          <ReportSectionBlock key={section.id} section={section} narrative={narrative} />
        ))}
      </div>
    </div>
  );
}