import React from 'react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

export default function RpSelect({ value, onChange, options, placeholder }) {
  return (
    <Select value={value || undefined} onValueChange={onChange}>
      <SelectTrigger className="bg-card"><SelectValue placeholder={placeholder} /></SelectTrigger>
      <SelectContent>{options.map((o) => <SelectItem key={o} value={o}>{o}</SelectItem>)}</SelectContent>
    </Select>
  );
}