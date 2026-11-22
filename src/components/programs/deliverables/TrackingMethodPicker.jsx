import React from 'react';
import { Switch } from '@/components/ui/switch';
import { cn } from '@/lib/utils';
import { TRACK_METHODS } from '@/lib/programs/deliverableOptions';

/** Track Progress toggle + Tracking and Monitoring Method cards. */
export function TrackProgressRow({ enabled, onToggle, bare }) {
  return (
    <div className={cn('flex items-center justify-between gap-4', !bare && 'rounded-xl border border-border bg-card p-4')}>
      <div>
        <p className="text-sm font-semibold text-foreground">Track Progress</p>
        <p className="text-xs text-muted-foreground mt-0.5">Enable a tracking and monitoring method to measure progress.</p>
      </div>
      <Switch checked={enabled} onCheckedChange={onToggle} disabled={!onToggle} className="disabled:opacity-100 disabled:cursor-default" />
    </div>
  );
}

/** `bare` drops the container borders (used inside inline-edit cards). */
export default function TrackingMethodPicker({ enabled, method, onToggle, onMethod, bare }) {
  return (
    <div className={bare ? 'space-y-5' : 'space-y-3'}>
      <TrackProgressRow enabled={enabled} onToggle={onToggle} bare={bare} />
      {enabled && (
        <div className={cn(!bare && 'rounded-xl border border-border bg-card p-4')}>
          <p className="text-sm font-semibold text-foreground">Tracking and Monitoring Method</p>
          <p className="text-xs text-muted-foreground mt-0.5 mb-3">How would you like to track this deliverable?</p>
          <div role="radiogroup" className="grid grid-cols-3 gap-2">
            {TRACK_METHODS.map((m) => {
              const active = (method || 'completion') === m.value;
              return (
                <button
                  key={m.value}
                  type="button"
                  role="radio"
                  aria-checked={active}
                  onClick={() => onMethod(m.value)}
                  className={cn(
                    'text-left rounded-lg border bg-card px-3 py-3 shadow-sm transition-all hover:shadow-md',
                    active ? 'border-primary ring-1 ring-primary' : 'border-border'
                  )}
                >
                  <p className={cn('text-sm font-semibold whitespace-nowrap', active ? 'text-primary' : 'text-foreground')}>{m.label}</p>
                  <p className="text-xs text-muted-foreground mt-1">{m.description}</p>
                </button>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}