import React from 'react';
import { Switch } from '@/components/ui/switch';
import TrackingMethodFields from './TrackingMethodFields';
import SectionCard from '@/components/shared/SectionCard';
import { normalizeTracking, isInitiative, isMeasure, autoMethod } from './trackingConfig';

/** Guide text under the Track Progress toggle, per level. */
export function trackProgressGuide(level) {
  if (isInitiative(level)) return 'Enable to track progress through the completion of milestones.';
  if (isMeasure(level)) return 'Enable to track performance through data reported across reporting periods.';
  return 'Enable tracking and monitoring method for this deliverable to measure progress and effectiveness.';
}

/**
 * "Track Progress" configuration for a Level 6 deliverable — a toggle wrapper
 * plus, for levels without a fixed method, the tracking method selector.
 * Rendered inside the deliverable detail pane while editing.
 */
export default function TrackProgressSection({ form, onChange }) {
  const auto = autoMethod(form.level);
  const tracking = normalizeTracking(form.tracking_config, form.level);

  const setTracking = (patch) => onChange('tracking_config')({ ...tracking, ...patch });

  return (
    <div className="space-y-5">
      {/* Toggle wrapper */}
      <SectionCard className="flex items-center justify-between gap-4">
        <div>
          <p className="text-sm font-bold text-foreground">Tracking and Monitoring</p>
          <p className="text-xs text-muted-foreground mt-0.5">{trackProgressGuide(form.level)}</p>
        </div>
        <Switch
          checked={tracking.enabled}
          onCheckedChange={(v) => setTracking({ enabled: v })}
        />
      </SectionCard>

      {tracking.enabled && !isInitiative(form.level) && (
        <div className="space-y-4">
          <div>
            <h3 className="text-sm font-bold text-foreground">
              {auto ? 'Unit of Measure' : 'Tracking and Monitoring Method'}
            </h3>
            <p className="text-xs text-muted-foreground mt-0.5">
              {auto
                ? 'Choose how reported values are presented in the reporting table.'
                : 'How would you like to track this deliverable? Choose how progress and performance will be monitored.'}
            </p>
          </div>

          <TrackingMethodFields form={form} onChange={onChange} />
        </div>
      )}
    </div>
  );
}