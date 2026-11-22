import React, { useState, useMemo } from 'react';
import { LIKELIHOOD_OPTIONS, CONSEQUENCE_OPTIONS, getRiskRating, RATING_STYLES } from '@/lib/riskMatrix';
import RatingBadge from '@/components/risk/RatingBadge';
import RiskDrilldownPane from './RiskDrilldownPane';
import { cn } from '@/lib/utils';
import { ELEVATED_CARD } from '@/components/shared/cardStyles';
import AxisArrow from './AxisArrow';
import ChartTooltipCard from './ChartTooltipCard';
import { Tooltip, TooltipTrigger, TooltipContent, TooltipProvider } from '@/components/ui/tooltip';

// Interactive 5x5 residual risk heatmap. Rows = Consequence (5 at top → 1 at bottom),
// Columns = Likelihood (1 → 5). Clicking a cell drills into the risks sitting in it.
export default function RiskHeatmap({ risks = [] }) {
  const [selected, setSelected] = useState(null); // { likelihood, consequence }

  // Group risks by their residual likelihood/consequence pair.
  const cellMap = useMemo(() => {
    const map = {};
    risks.forEach((r) => {
      const l = Number(r.residual_likelihood);
      const c = Number(r.residual_consequence);
      if (!l || !c) return;
      const key = `${l}-${c}`;
      (map[key] = map[key] || []).push(r);
    });
    return map;
  }, [risks]);

  const consequenceRows = [...CONSEQUENCE_OPTIONS].sort((a, b) => b.value - a.value); // 5 → 1

  const selectedRisks = selected ? cellMap[`${selected.likelihood}-${selected.consequence}`] || [] : [];

  return (
    <div className={cn(ELEVATED_CARD, 'p-5')}>
      <div className="mb-1">
        <h3 className="text-lg font-bold text-foreground">Residual Risk Heatmap</h3>
        <p className="text-xs text-muted-foreground mt-0.5">Risks matrix by residual likelihood and consequence. 

        </p>
      </div>

      <div className="mt-4 flex">
        {/* Y axis label — Consequence, rotated vertical with a double arrow */}
        <div className="flex items-stretch pr-3" style={{ paddingBottom: 34 }}>
          <AxisArrow orientation="vertical" label="Consequence" />
        </div>

        <div className="flex-1">
          {/* Grid: consequence label column + 5 likelihood columns */}
          <div>
            {consequenceRows.map((row, rowIndex) =>
            <div key={row.value} className="flex">
                <div className="w-20 shrink-0 flex items-center justify-end pr-2 py-1">
                  <span className="text-[9px] leading-tight text-muted-foreground text-right">{row.label}</span>
                </div>
                {LIKELIHOOD_OPTIONS.map((col) => {
                const rating = getRiskRating(col.value, row.value);
                const style = RATING_STYLES[rating] || { bg: 'bg-muted', text: 'text-foreground' };
                const count = (cellMap[`${col.value}-${row.value}`] || []).length;
                const isSelected =
                selected && selected.likelihood === col.value && selected.consequence === row.value;
                return (
                  <TooltipProvider key={col.value} delayDuration={100}>
                  <Tooltip>
                  <TooltipTrigger asChild>
                  <button
                    onClick={() =>
                    setSelected(
                      isSelected ? null : { likelihood: col.value, consequence: row.value }
                    )
                    }
                    // Cells pop in on a diagonal sweep from the top-left corner.
                    style={{ animationDelay: `${400 + (rowIndex + col.value - 1) * 70}ms` }}
                    className={cn(
                      'heatmap-cell-enter relative flex-1 aspect-square m-0.5 rounded-md flex items-center justify-center transition-[transform,box-shadow] duration-200 ease-out overflow-hidden',
                      style.bg,
                      style.text,
                      // Subtle lift on hover; motion-safe keeps it static for reduced-motion users.
                      'hover:shadow-md hover:z-10 motion-safe:hover:-translate-y-0.5',
                      isSelected && 'ring-2 ring-offset-1 ring-foreground'
                    )}>
                    
                      {/* Faded watermark band label — pinned to bottom center */}
                      {rating &&
                    <span className="absolute inset-x-0 bottom-0.5 flex items-center justify-center text-center px-0.5 text-[8px] font-semibold leading-tight opacity-70 pointer-events-none">
                          {rating}
                        </span>
                    }
                      {count > 0 &&
                    <span className="relative font-bold leading-none drop-shadow text-sm">{count}</span>
                    }
                    </button>
                  </TooltipTrigger>
                  <TooltipContent className="p-0 bg-transparent border-0 shadow-none">
                    <ChartTooltipCard title={`Likelihood ${col.value} × Consequence ${row.value}`}>
                      <span className="font-semibold text-foreground">{count}</span> risk{count === 1 ? '' : 's'}{rating ? ` · ${rating}` : ''}
                    </ChartTooltipCard>
                  </TooltipContent>
                  </Tooltip>
                  </TooltipProvider>);

              })}
              </div>
            )}

            {/* X axis likelihood labels */}
            <div className="flex">
              <div className="w-20 shrink-0" />
              {LIKELIHOOD_OPTIONS.map((col) =>
              <div key={col.value} className="flex-1 px-0.5 pt-1 text-center">
                  <span className="leading-tight text-muted-foreground text-[10px]">{col.label}</span>
                </div>
              )}
            </div>
            <div className="flex mt-2">
              <div className="w-20 shrink-0" />
              <div className="flex-1">
                <AxisArrow label="Likelihood" />
              </div>
            </div>
          </div>
        </div>
      </div>

      <RiskDrilldownPane
        isOpen={!!selected}
        onClose={() => setSelected(null)}
        title="Residual Risk Heatmap"
        subtitle={selected ? `Likelihood ${selected.likelihood} × Consequence ${selected.consequence}` : ''}
        badge={selected ? <RatingBadge rating={getRiskRating(selected.likelihood, selected.consequence)} /> : null}
        risks={selectedRisks} />
    </div>);

}