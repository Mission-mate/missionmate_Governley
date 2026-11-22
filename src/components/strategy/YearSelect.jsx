import React from 'react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

/** Year dropdown covering the supported strategy period range. */
const YEARS = Array.from({ length: 2050 - 2020 + 1 }, (_, i) => String(2020 + i));

export default function YearSelect({ value, onChange, placeholder = 'Year' }) {
  return (
    <Select value={value || undefined} onValueChange={onChange}>
      <SelectTrigger>
        <SelectValue placeholder={placeholder} />
      </SelectTrigger>
      <SelectContent className="max-h-64">
        {YEARS.map((y) => (
          <SelectItem key={y} value={y}>{y}</SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}