import React from 'react';
import { Input } from '@/components/ui/input';
import DateField from '@/components/ui/DateField';
import ColoredSelect from '@/components/shared/ColoredSelect';
import OwnerMultiField from '@/components/strategy/OwnerMultiField';
import { optionBadgeClass } from '@/components/strategy/customFields/StrategyCustomCell';
import { cn } from '@/lib/utils';

/** Edit control for one planner column value, used only inside the task side pane. */
export default function PlannerCellInput({ column, value, onChange }) {
  const options = column.config?.options || [];
  if (column.type === 'Single Select') {
    return <ColoredSelect value={value} onChange={(v) => onChange(v || '')} options={options} className="bg-background" />;
  }
  if (column.type === 'Multi Select') {
    const list = value || [];
    const toggle = (name) => onChange(list.includes(name) ? list.filter((n) => n !== name) : [...list, name]);
    return (
      <div className="flex flex-wrap gap-1.5">
        {options.length === 0 && <span className="text-xs text-muted-foreground">No options configured.</span>}
        {options.map((o) => (
          <button key={o.name} type="button" onClick={() => toggle(o.name)}
            className={cn('text-xs font-medium rounded-full px-2.5 py-1 border transition-all', list.includes(o.name) ? cn(optionBadgeClass(column, o.name), 'border-transparent') : 'border-border text-muted-foreground hover:text-foreground')}>
            {o.name}
          </button>
        ))}
      </div>
    );
  }
  if (column.type === 'People' && column.system_key === 'owner') {
    return <Input value={(value || [])[0] || ''} onChange={(e) => onChange(e.target.value ? [e.target.value] : [])} placeholder="e.g. Jane Smith" className="bg-background" />;
  }
  if (column.type === 'People') return <OwnerMultiField value={value || []} onChange={onChange} label={column.title} placeholder="Add a person" labelClassName="text-xs font-medium text-muted-foreground" />;
  if (column.type === 'Date') return <DateField value={value} onChange={onChange} inputClassName="bg-background" />;
  if (column.type === 'Progress') {
    return <Input type="number" min={0} max={100} value={value} placeholder="0 - 100" className="bg-background"
      onChange={(e) => onChange(e.target.value === '' ? '' : String(Math.max(0, Math.min(100, Number(e.target.value)))))} />;
  }
  return <Input value={value} onChange={(e) => onChange(e.target.value)} className="bg-background" />;
}