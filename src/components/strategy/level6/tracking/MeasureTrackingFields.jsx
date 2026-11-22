import React from 'react';
import { Info } from 'lucide-react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { UNIT_OPTIONS, unitLabel, DIRECTION_OPTIONS } from './trackingConfig';
import ReportingFrequencyField from './ReportingFrequencyField';
import DirectionLabel from './DirectionLabel';
import SectionCard from '@/components/shared/SectionCard';

const Label = ({ children, hint }) => (
  <div className="flex items-center gap-1.5 mb-1.5">
    <span className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wide">
      {children} <span className="text-red-500">*</span>
    </span>
    {hint && (
      <TooltipProvider delayDuration={100}>
        <Tooltip>
          <TooltipTrigger asChild>
            <button type="button" className="text-muted-foreground/70 hover:text-foreground">
              <Info className="w-3.5 h-3.5" />
            </button>
          </TooltipTrigger>
          <TooltipContent className="max-w-[240px] text-xs leading-snug">{hint}</TooltipContent>
        </Tooltip>
      </TooltipProvider>
    )}
  </div>
);

const DIRECTION_HINT = (
  <span>
    <strong>Higher is Better</strong> — e.g. revenue growth
    <br />
    <strong>Lower is Better</strong> — e.g. cost, complaints
  </span>
);

/**
 * Measure (Level 7) tracking fields — Reporting Frequency, Unit of Measure and
 * Direction shown in one muted wrapper, editable or read-only.
 */
export default function MeasureTrackingFields({
  frequency,
  tracking,
  intervalValue,
  intervalUnit,
  onFrequencyChange,
  onIntervalValueChange,
  onIntervalUnitChange,
  onTrackingChange,
  editing,
}) {
  const isEvery = frequency === 'Every';
  const frequencyText = isEvery
    ? `Every ${intervalValue || 1} ${intervalUnit || 'Months'}`
    : frequency || '—';
  return (
    <SectionCard className="grid grid-cols-1 sm:grid-cols-3 gap-4">
      <div>
        <Label>Reporting Frequency</Label>
        {editing ? (
          <ReportingFrequencyField
            frequency={frequency}
            intervalValue={intervalValue}
            intervalUnit={intervalUnit}
            onFrequencyChange={onFrequencyChange}
            onIntervalValueChange={onIntervalValueChange}
            onIntervalUnitChange={onIntervalUnitChange}
            triggerClassName="bg-card"
          />
        ) : (
          <p className="text-sm text-foreground">{frequencyText}</p>
        )}
      </div>

      <div>
        <Label>Unit of Measure</Label>
        {editing ? (
          <Select value={tracking.unit} onValueChange={(v) => onTrackingChange({ unit: v })}>
            <SelectTrigger className="bg-card"><SelectValue placeholder="Select unit..." /></SelectTrigger>
            <SelectContent>
              {UNIT_OPTIONS.map((u) => <SelectItem key={u} value={u}>{unitLabel(u)}</SelectItem>)}
            </SelectContent>
          </Select>
        ) : (
          <p className="text-sm text-foreground">{unitLabel(tracking.unit) || '—'}</p>
        )}
      </div>

      <div>
        <Label hint={DIRECTION_HINT}>Direction</Label>
        {editing ? (
          <Select value={tracking.direction || undefined} onValueChange={(v) => onTrackingChange({ direction: v })}>
            <SelectTrigger className="bg-card"><SelectValue placeholder="Select direction..." /></SelectTrigger>
            <SelectContent>
              {DIRECTION_OPTIONS.map((d) => (
                <SelectItem key={d} value={d}><DirectionLabel value={d} /></SelectItem>
              ))}
            </SelectContent>
          </Select>
        ) : (
          <DirectionLabel value={tracking.direction} />
        )}
      </div>
    </SectionCard>
  );
}