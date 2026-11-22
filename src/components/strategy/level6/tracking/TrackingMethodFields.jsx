import React from 'react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { cn } from '@/lib/utils';
import { TRACKING_METHODS, UNIT_OPTIONS, unitLabel, normalizeTracking, autoMethod } from './trackingConfig';
import SectionCard from '@/components/shared/SectionCard';

const FieldLabel = ({ children, required }) =>
<label className="text-sm font-medium text-foreground block mb-1.5">
    {children}{required && <span className="text-red-500"> *</span>}
  </label>;


/**
 * Tracking method selector + method-specific reporting fields.
 * Levels with a fixed method (Initiatives, Measures) skip the selector entirely.
 */
export default function TrackingMethodFields({ form, onChange }) {
  const tracking = normalizeTracking(form.tracking_config, form.level);
  const auto = autoMethod(form.level);
  const setTracking = (patch) => onChange('tracking_config')({ ...tracking, ...patch });

  return (
    <div className="space-y-4">
      {!auto &&
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        {TRACKING_METHODS.map((m) =>
        <button
          key={m.id}
          type="button"
          onClick={() => setTracking({ method: m.id })}
          className={cn(
            'text-left rounded-xl border p-3 transition-colors',
            tracking.method === m.id ?
            'border-primary bg-primary/5 ring-1 ring-primary' :
            'border-border hover:border-primary/40'
          )}>

            <p className={cn('text-sm font-bold', tracking.method === m.id ? 'text-primary' : 'text-foreground')}>{m.title}</p>
            <p className="text-[11px] text-muted-foreground mt-1 leading-snug">{m.guide}</p>
          </button>
        )}
      </div>
      }

      {(tracking.method === 'count' || tracking.method === 'both') &&
      <SectionCard className="space-y-4">
          <div>
            <FieldLabel required>Unit of Measure</FieldLabel>
            <Select value={tracking.unit} onValueChange={(v) => setTracking({ unit: v })}>
              <SelectTrigger className="bg-card"><SelectValue placeholder="Select unit..." /></SelectTrigger>
              <SelectContent>
                {UNIT_OPTIONS.map((u) => <SelectItem key={u} value={u}>{unitLabel(u)}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
        </SectionCard>
      }
    </div>);

}