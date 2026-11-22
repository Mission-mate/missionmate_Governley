import React from 'react';
import { cn } from '@/lib/utils';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import OwnerMultiField from '@/components/strategy/OwnerMultiField';
import InfoTooltip from '@/components/risk/InfoTooltip';
import StrategyCustomCell, { optionBadgeClass } from './StrategyCustomCell';

const asList = (v) => (Array.isArray(v) ? v : v ? [v] : []);

/**
 * Editable / read-only fields for a level's custom columns, rendered as grid
 * cells so they sit alongside Health, Owner and Priority in a pane's meta card.
 */
export default function StrategyCustomFields({ columns = [], values = {}, editing, onChange, inputClassName = 'h-8 bg-card' }) {
  if (!columns.length) return null;

  const setValue = (id) => (v) => onChange?.({ ...(values || {}), [id]: v });

  return columns.map((col) => {
    const value = values?.[col.id];

    // People uses OwnerMultiField, which renders its own label row.
    if (editing && col.type === 'People') {
      return (
        <OwnerMultiField
          key={col.id}
          label={col.title}
          value={asList(value)}
          onChange={setValue(col.id)}
          inputClassName={inputClassName}
        />
      );
    }

    return (
      <div key={col.id} className="space-y-1.5">
        <p className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wide flex items-center gap-1.5">
          {col.title}
          {col.tooltip && <InfoTooltip text={col.tooltip} />}
        </p>

        {!editing ? (
          <StrategyCustomCell column={col} value={value} />
        ) : col.type === 'Single Select' ? (
          <Select value={value || undefined} onValueChange={setValue(col.id)}>
            <SelectTrigger className={inputClassName}>
              <SelectValue placeholder={`Select ${col.title.toLowerCase()}...`} />
            </SelectTrigger>
            <SelectContent>
              {(col.config?.options || []).map((o) => (
                <SelectItem key={o.name} value={o.name}>
                  <span className={cn('inline-flex items-center text-xs font-medium rounded-full px-2 py-0.5', optionBadgeClass(col, o.name))}>
                    {o.name}
                  </span>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        ) : col.type === 'Date' ? (
          <Input type="date" value={value || ''} onChange={(e) => setValue(col.id)(e.target.value)} className={inputClassName} />
        ) : col.type === 'Progress' ? (
          <Input
            type="number"
            min={0}
            max={100}
            value={value ?? ''}
            onChange={(e) => setValue(col.id)(e.target.value === '' ? '' : Number(e.target.value))}
            className={inputClassName}
          />
        ) : (
          <Input value={value ?? ''} onChange={(e) => setValue(col.id)(e.target.value)} className={inputClassName} />
        )}
      </div>
    );
  });
}