import React from 'react';
import DateField from '@/components/ui/DateField';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { PERIOD_PRESETS } from '@/lib/attendancePeriods';

/**
 * Period preset selector + From / To date range for the Meeting Attendance tab.
 * Date pickers are only editable when the "Custom" preset is selected.
 */
export default function AttendanceDateRange({ preset, from, to, onPresetChange, onFromChange, onToChange }) {
  const isCustom = preset === 'custom';
  return (
    <div className="flex items-center gap-3">
      <Select value={preset} onValueChange={onPresetChange}>
        <SelectTrigger className="w-auto min-w-[200px]"><SelectValue /></SelectTrigger>
        <SelectContent>
          {PERIOD_PRESETS.map(p => <SelectItem key={p.key} value={p.key}>{p.label}</SelectItem>)}
        </SelectContent>
      </Select>
      <DateField
        value={from}
        onChange={onFromChange}
        placeholder="Start date"
        className="w-40"
        disabled={!isCustom}
      />
      <DateField
        value={to}
        onChange={onToChange}
        placeholder="End date"
        className="w-40"
        disabled={!isCustom}
      />
    </div>
  );
}