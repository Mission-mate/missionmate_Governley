import React from 'react';
import { normalizeTracking, TRACKING_METHODS, unitLabel, autoMethod, isInitiative } from './trackingConfig';
import DirectionLabel from './DirectionLabel';
import SectionCard from '@/components/shared/SectionCard';

const Row = ({ label, value }) => (
  <div className="space-y-1.5">
    <p className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wide">{label}</p>
    <p className="text-sm text-foreground">{value || '—'}</p>
  </div>
);

/** Read-only Track Progress summary shown on the Overview tab when tracking is enabled. */
export default function TrackProgressView({ block }) {
  const t = normalizeTracking(block.tracking_config, block.level);
  // Initiatives have no method or unit to display — the toggle alone drives the tasks tab.
  if (isInitiative(block.level) || !t.enabled || !t.method) return null;

  const auto = autoMethod(block.level);
  const method = TRACKING_METHODS.find((m) => m.id === t.method);
  const showCount = t.method === 'count' || t.method === 'both';
  const frequency =
    block.reporting_frequency === 'Every'
      ? `Every ${block.reporting_interval_value || ''} ${block.reporting_interval_unit || 'Months'}`.trim()
      : block.reporting_frequency;

  return (
    <div className="space-y-4">
      {!auto && (
        <SectionCard className="space-y-1">
          <p className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wide">
            Tracking and Monitoring Method
          </p>
          <p className="text-sm font-semibold text-foreground">{method?.title || '—'}</p>
          {method?.guide && <p className="text-xs text-muted-foreground leading-snug">{method.guide}</p>}
        </SectionCard>
      )}

      {showCount && (
        <SectionCard className="grid grid-cols-3 gap-4">
          <Row label="Reporting Frequency" value={frequency} />
          <Row label="Unit of Measure" value={unitLabel(t.unit)} />
          <div className="space-y-1.5">
            <p className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wide">Direction</p>
            <DirectionLabel value={t.direction} />
          </div>
        </SectionCard>
      )}
    </div>
  );
}