import React from 'react';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { format, parseISO } from 'date-fns';
import OptionSelect from './OptionSelect';
import { optionName } from '@/lib/programs/deliverableOptions';

/** Input for one Customiser column. */
export function CustomFieldInput({ column, value, onChange }) {
  if (column.type === 'Single Select') {
    const options = (column.config?.options || []).map(optionName).filter(Boolean);
    return <OptionSelect value={value} onChange={onChange} options={options} />;
  }
  if (column.type === 'Long Text') return <Textarea rows={2} value={value ?? ''} onChange={(e) => onChange(e.target.value)} />;
  return <Input type={column.type === 'Date' ? 'date' : 'text'} value={value ?? ''} onChange={(e) => onChange(e.target.value)} />;
}

/** Read-only display of a custom field value. */
export function customFieldText(column, value) {
  if (value === undefined || value === null || value === '') return '—';
  if (column.type === 'Date') {
    try { return format(parseISO(value), 'dd MMM yyyy'); } catch { return value; }
  }
  return String(value);
}