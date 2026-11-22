import React, { useState, useRef } from 'react';
import { risksOutsideAppetite } from '@/lib/riskAnalytics';
import RiskDrilldownPane from './RiskDrilldownPane';
import { cn } from '@/lib/utils';
import { ELEVATED_CARD } from '@/components/shared/cardStyles';

const ACCEPTABLE_PILL = 'inline-flex items-center rounded-full border border-green-300 bg-green-50 dark:border-green-400/30 dark:bg-green-400/15 dark:text-green-300 whitespace-nowrap px-2.5 py-1 text-xs font-medium text-green-700';

const MAX = 25;

// Risk Appetite & Tolerance — a draggable threshold slider (0–25) persisted to AppConfig.
// Threshold state lives in the parent (useAppetiteThreshold) so summary cards stay in sync.
export default function RiskAppetitePanel({ risks = [], threshold, setThreshold, persist }) {
  const [paneOpen, setPaneOpen] = useState(false);
  const trackRef = useRef(null);
  const draggingRef = useRef(false);

  const valueFromPointer = (clientX) => {
    const track = trackRef.current;
    if (!track) return threshold;
    const rect = track.getBoundingClientRect();
    const ratio = Math.min(1, Math.max(0, (clientX - rect.left) / rect.width));
    return Math.round(ratio * MAX);
  };

  const handlePointerDown = (e) => {
    draggingRef.current = true;
    setThreshold(valueFromPointer(e.clientX));
    e.target.setPointerCapture?.(e.pointerId);
  };

  const handlePointerMove = (e) => {
    if (!draggingRef.current) return;
    setThreshold(valueFromPointer(e.clientX));
  };

  const handlePointerUp = () => {
    if (!draggingRef.current) return;
    draggingRef.current = false;
    persist(threshold);
  };

  const pct = (threshold / MAX) * 100;

  // Risks whose residual score meets/exceeds the appetite threshold.
  const exceedingRisks = risksOutsideAppetite(risks, threshold);
  const exceedingCount = exceedingRisks.length;

  return (
    <div className={cn(ELEVATED_CARD, 'p-5')}>
      <div className="mb-1">
        <h3 className="text-lg font-bold text-foreground">Risk Appetite</h3>
        <p className="text-xs text-muted-foreground mt-0.5">Organizational Risk Appetite Threshold</p>
      </div>

      <div className="mt-4" />

      <div className="flex items-center gap-4">
        <div
          ref={trackRef}
          onPointerDown={handlePointerDown}
          onPointerMove={handlePointerMove}
          onPointerUp={handlePointerUp}
          className="relative flex-1 h-6 flex items-center cursor-pointer touch-none select-none"
        >
          <div className="absolute inset-x-0 h-1.5 rounded-full bg-muted" />
          <div className="absolute left-0 h-1.5 rounded-full bg-primary" style={{ width: `${pct}%` }} />
          <div
            className="absolute w-5 h-5 -ml-2.5 rounded-full bg-card border-2 border-primary shadow"
            style={{ left: `${pct}%` }}
          />
        </div>
        <span className="text-2xl font-bold text-foreground w-8 text-right tabular-nums">{threshold}</span>
      </div>

      <p className="text-sm font-medium text-foreground mt-3 mb-2">Threshold Preview:</p>
      <div className="flex flex-nowrap items-center gap-1.5">
        <span className={ACCEPTABLE_PILL}>
          Score &lt; {threshold} (Acceptable)
        </span>
        <span className="inline-flex items-center rounded-full bg-red-500 whitespace-nowrap px-2.5 py-1 text-xs font-medium text-white">
          Score ≥ {threshold} (Outside Appetite)
        </span>
        {exceedingCount === 0 ? (
          <span className={ACCEPTABLE_PILL}>
            No risk outside appetite
          </span>
        ) : (
          <button
            onClick={() => setPaneOpen(true)}
            className="inline-flex items-center rounded-full bg-red-500 whitespace-nowrap px-2.5 py-1 text-xs font-medium text-white hover:bg-red-600 transition-colors"
          >
            {`${exceedingCount} risk${exceedingCount === 1 ? '' : 's'} outside appetite`}
          </button>
        )}
      </div>

      <RiskDrilldownPane
        isOpen={paneOpen}
        onClose={() => setPaneOpen(false)}
        title="Risk Appetite"
        subtitle={`Risks scored at or above the threshold of ${threshold}`}
        risks={exceedingRisks}
      />
    </div>
  );
}