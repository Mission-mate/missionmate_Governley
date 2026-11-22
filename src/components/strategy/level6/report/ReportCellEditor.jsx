import React from 'react';
import { Input } from '@/components/ui/input';
import DateField from '@/components/ui/DateField';
import { OPTION_COLORS } from '@/lib/registerColors';
import { cn } from '@/lib/utils';
import { format, parseISO, isValid } from 'date-fns';
import OptionSelectPill from '@/components/strategy/level5/tasks/detail/OptionSelectPill';

/** Read-only display of a custom column value. */
export function CustomCellDisplay({ column, value }) {
  if (value === null || value === undefined || value === '') return <span className="text-muted-foreground">—</span>;
  if (column.type === 'Single Select' || column.type === 'Multi Select') {
    const opt = (column.config?.options || []).find((o) => o.name === value);
    const c = OPTION_COLORS.find((x) => x.id === opt?.color);
    return (
      <span className={cn('inline-flex items-center text-xs font-medium rounded-full px-2.5 py-0.5', c ? `${c.bg} ${c.text}` : 'bg-muted text-foreground')}>
        {String(value)}
      </span>
    );
  }
  if (column.type === 'Checkbox') return <span>{value ? '✓' : '—'}</span>;
  if (column.type === 'Date') {
    try {
      const d = parseISO(value);
      if (isValid(d)) return <span>{format(d, 'd MMM yyyy')}</span>;
    } catch { /* fall through */ }
  }
  return <span>{String(value)}</span>;
}

/** Inline editor for a custom column value. */
export function CustomCellEditor({ column, value, onChange, fieldClassName }) {
  if (column.type === 'Single Select' || column.type === 'Multi Select') {
    return <OptionSelectPill options={column.config?.options || []} value={value} onChange={onChange} />;
  }
  if (column.type === 'Checkbox') {
    return <input type="checkbox" checked={!!value} onChange={(e) => onChange(e.target.checked)} className="w-4 h-4 accent-primary" />;
  }
  if (column.type === 'Date') {
    return <DateField value={value || ''} onChange={onChange} placeholder="DD MMM YYYY" inputClassName={fieldClassName} />;
  }
  return <Input value={value ?? ''} onChange={(e) => onChange(e.target.value)} className={cn('h-8', fieldClassName)} />;
}