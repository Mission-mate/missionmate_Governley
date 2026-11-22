import React from 'react';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { FREQUENCY_OPTIONS, INTERVAL_UNITS } from './trackingConfig';

/**
 * Reporting frequency selector — shows a custom interval (value + Months/Years)
 * when the "Every" option is chosen.
 */
export default function ReportingFrequencyField({
  frequency,
  intervalValue,
  intervalUnit,
  onFrequencyChange,
  onIntervalValueChange,
  onIntervalUnitChange,
  triggerClassName = '',
}) {
  return (
    <div className="space-y-2">
      <Select value={frequency || undefined} onValueChange={onFrequencyChange}>
        <SelectTrigger className={triggerClassName}><SelectValue placeholder="Select frequency..." /></SelectTrigger>
        <SelectContent>
          {FREQUENCY_OPTIONS.map((f) => <SelectItem key={f} value={f}>{f}</SelectItem>)}
        </SelectContent>
      </Select>
      {frequency === 'Every' && (
        <div className="flex gap-2">
          <Input
            type="number"
            min="1"
            step="1"
            className={`w-20 ${triggerClassName}`}
            value={intervalValue ?? ''}
            onChange={(e) => onIntervalValueChange(e.target.value === '' ? '' : Number(e.target.value))}
          />
          <Select value={intervalUnit || 'Months'} onValueChange={onIntervalUnitChange}>
            <SelectTrigger className={`flex-1 ${triggerClassName}`}><SelectValue /></SelectTrigger>
            <SelectContent>
              {INTERVAL_UNITS.map((u) => <SelectItem key={u} value={u}>{u}</SelectItem>)}
            </SelectContent>
          </Select>
        </div>
      )}
    </div>
  );
}