import React, { useState, useEffect } from 'react';
import { Pencil } from 'lucide-react';
import { Switch } from '@/components/ui/switch';
import { Button } from '@/components/ui/button';
import { ELEVATED_SECTION } from '@/components/shared/cardStyles';
import SectionCard from './SectionCard';
import TrackingMethodFields from '../tracking/TrackingMethodFields';
import TrackProgressView from '../tracking/TrackProgressView';
import MeasureTrackingFields from '../tracking/MeasureTrackingFields';
import { trackProgressGuide } from '../tracking/TrackProgressSection';
import { normalizeTracking, isInitiative, isMeasure, autoMethod } from '../tracking/trackingConfig';

const KEYS = ['tracking_config', 'reporting_frequency', 'reporting_interval_value', 'reporting_interval_unit'];
const pick = (item) => KEYS.reduce((a, k) => ({ ...a, [k]: item[k] }), {});

/** Tracking and Monitoring toggle + level-specific tracking configuration. */
export default function DeliverableTrackingCard({ item, onSave, saving }) {
  const [form, setForm] = useState(pick(item));
  const [editing, setEditing] = useState(false);

  useEffect(() => { setForm(pick(item)); setEditing(false); }, [item]);

  const set = (k) => (v) => setForm((f) => ({ ...f, [k]: v }));
  // Initiatives (Tasks & Milestones) and Measures (Data Reporting) have a fixed
  // method — the toggle alone turns their tabs on and saves instantly.
  const auto = autoMethod(item.level);
  const measure = isMeasure(item.level);
  const tracking = normalizeTracking(form.tracking_config, item.level);

  const setTracking = (patch) => set('tracking_config')({ ...tracking, ...patch });

  const toggle = (v) => {
    const next = { ...tracking, enabled: v };
    // Measures always carry a frequency, unit and direction once tracking is on.
    if (measure && v) {
      next.unit = next.unit || '#';
      next.direction = next.direction || 'Higher is Better';
    }
    const patch = { tracking_config: next };
    if (measure && v && !form.reporting_frequency) patch.reporting_frequency = 'Quarterly';
    setForm((f) => ({ ...f, ...patch }));
    if (auto) {
      onSave(patch);
      return;
    }
    setEditing(v && !tracking.method);
  };

  const save = async () => {
    if (measure && (!form.reporting_frequency || !tracking.unit || !tracking.direction)) return;
    await onSave(form);
    setEditing(false);
  };

  const cancel = () => {
    setForm(pick(item));
    setEditing(false);
  };

  const header = (
    <div className="flex items-center justify-between gap-4">
      <div>
        <p className="text-base font-bold text-foreground">Tracking and Monitoring</p>
        <p className="text-xs text-muted-foreground mt-0.5">{trackProgressGuide(item.level)}</p>
      </div>
      <div className="flex items-center gap-4 shrink-0">
        {measure && tracking.enabled && !editing && (
          <button
            onClick={() => setEditing(true)}
            className="flex items-center gap-1.5 text-sm font-medium text-muted-foreground hover:text-primary transition-colors"
          >
            <Pencil className="w-3.5 h-3.5" /> Edit
          </button>
        )}
        <Switch checked={tracking.enabled} onCheckedChange={toggle} />
      </div>
    </div>
  );

  // Measures: toggle and its fields live in one combined section.
  if (measure) {
    return (
      <div className={ELEVATED_SECTION}>
        {header}
        {tracking.enabled && (
          <div className="mt-4">
            <MeasureTrackingFields
              frequency={form.reporting_frequency}
              tracking={tracking}
              intervalValue={form.reporting_interval_value}
              intervalUnit={form.reporting_interval_unit}
              onFrequencyChange={set('reporting_frequency')}
              onIntervalValueChange={set('reporting_interval_value')}
              onIntervalUnitChange={set('reporting_interval_unit')}
              onTrackingChange={setTracking}
              editing={editing}
            />
            {editing && (
              <div className="flex justify-end gap-2 mt-4">
                <Button variant="outline" onClick={cancel}>Cancel</Button>
                <Button onClick={save} disabled={saving}>Save Changes</Button>
              </div>
            )}
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className={ELEVATED_SECTION}>{header}</div>

      {tracking.enabled && !isInitiative(item.level) && (
        <SectionCard
          title="Tracking and Monitoring Method"
          subtitle={editing ? 'How would you like to track this deliverable? Choose how progress and performance will be monitored.' : undefined}
          onEdit={() => setEditing(true)}
          showEdit={!editing}
        >
          {editing ? (
            <>
              <TrackingMethodFields form={{ ...item, ...form }} onChange={set} />
              <div className="flex justify-end gap-2 mt-4">
                <Button variant="outline" onClick={cancel}>Cancel</Button>
                <Button onClick={save} disabled={saving}>Save Changes</Button>
              </div>
            </>
          ) : (
            <TrackProgressView block={{ ...item, ...form }} />
          )}
        </SectionCard>
      )}
    </div>
  );
}