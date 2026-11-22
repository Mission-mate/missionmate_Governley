import React from 'react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import PolicyBadge from './PolicyBadge';

/** Select whose options (and selected value) render as coloured policy labels. */
export default function BadgeSelect({ value, onChange, options, placeholder = 'Select...' }) {
  return (
    <Select value={value || ''} onValueChange={onChange}>
      <SelectTrigger className="bg-white"><SelectValue placeholder={placeholder} /></SelectTrigger>
      <SelectContent>
        {options.map((o) => {
          const v = o.value ?? o;
          return <SelectItem key={v} value={v}><PolicyBadge value={v} /></SelectItem>;
        })}
      </SelectContent>
    </Select>
  );
}