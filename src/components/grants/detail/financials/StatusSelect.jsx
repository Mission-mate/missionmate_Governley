import React from 'react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import StatusPill, { STATUS_OPTIONS } from '@/components/grants/detail/financials/StatusPill';

/** Status dropdown that renders each choice as a coloured pill. */
export default function StatusSelect({ value = 'scheduled', onChange }) {
  return (
    <Select value={value} onValueChange={onChange}>
      <SelectTrigger className="text-sm bg-white dark:bg-card">
        <SelectValue>
          <StatusPill status={value} />
        </SelectValue>
      </SelectTrigger>
      <SelectContent>
        {STATUS_OPTIONS.map(opt => (
          <SelectItem key={opt.value} value={opt.value}>
            <StatusPill status={opt.value} />
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}