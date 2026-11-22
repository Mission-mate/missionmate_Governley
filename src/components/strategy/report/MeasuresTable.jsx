import React from 'react';
import {
  POSITION_LABEL,
  POSITION_PILL,
  formatGap,
  formatMeasureValue,
} from '@/lib/strategy/measurePosition';

const COLS = 'grid grid-cols-[1.7fr_0.8fr_0.8fr_0.8fr_1fr] gap-2';

/**
 * Performance measures as at the report date — every tracked measure with its
 * current value, target, gap and point-in-time current position.
 */
export default function MeasuresTable({ measures }) {
  if (!measures?.length) return null;

  return (
    <div className="content-enter rounded-xl border border-border overflow-hidden">
      <div className={`${COLS} px-3.5 py-2 bg-secondary/40 border-b border-border text-xs font-semibold text-foreground/80 uppercase tracking-wide items-center`}>
        <span>Measure</span><span>Current</span><span>Target</span><span>Gap</span><span>Current position</span>
      </div>
      {measures.map((m) => (
        <div key={m.id} className={`${COLS} px-3.5 py-2.5 border-b border-border last:border-0 text-[13px] items-center`}>
          <span className="font-semibold text-foreground truncate" title={m.title}>
            {m.custom_id ? `${m.custom_id} · ` : ''}{m.title}
          </span>
          <span className="text-muted-foreground">{formatMeasureValue(m.current_value, m.unit)}</span>
          <span className="text-muted-foreground">{formatMeasureValue(m.target, m.unit)}</span>
          <span className="text-muted-foreground">{formatGap(m.gap, m.unit)}</span>
          <span>
            <span className={`inline-flex items-center px-2 py-0.5 rounded-full border text-[11px] font-medium ${POSITION_PILL[m.current_position] || POSITION_PILL.no_data}`}>
              {POSITION_LABEL[m.current_position] || POSITION_LABEL.no_data}
            </span>
          </span>
        </div>
      ))}
    </div>
  );
}