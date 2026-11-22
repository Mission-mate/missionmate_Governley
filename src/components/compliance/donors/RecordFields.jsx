import React from 'react';
import { Input } from '@/components/ui/input';
import AssetField from '@/components/compliance/assets/AssetField';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import DateField from '@/components/ui/DateField';
import AutoGrowTextarea from '@/components/shared/AutoGrowTextarea';
import AddDescriptionToggle from '@/components/compliance/assets/AddDescriptionToggle';
import AssetBadge from '@/components/compliance/assets/AssetBadge';
import { cn } from '@/lib/utils';
import { displayValue } from '@/lib/donorRegister';
import DonorPicker from './DonorPicker';

function Editor({ f, value, set, donors, isNew, error }) {
  if (f.type === 'select') return (
    <Select value={value || undefined} onValueChange={set}>
      <SelectTrigger className="bg-card"><SelectValue placeholder="Select..." /></SelectTrigger>
      <SelectContent className="z-[300]">{f.options.map((o) => <SelectItem key={o.name} value={o.name}><AssetBadge value={o.name} options={f.options} /></SelectItem>)}</SelectContent>
    </Select>
  );
  if (f.type === 'date') return <DateField value={value || ''} onChange={set} inputClassName="bg-card" />;
  if (f.type === 'donor') return <DonorPicker value={value} onChange={set} donors={donors} />;
  if (f.type === 'readonly') return <p className="text-sm text-muted-foreground h-9 flex items-center">{value || 'Calculated from Date Received'}</p>;
  if (f.type === 'description') return isNew
    ? <AddDescriptionToggle value={value} onChange={set} placeholder="Describe the donation" />
    : <AutoGrowTextarea value={value || ''} onChange={(e) => set(e.target.value)} placeholder="Describe the donation" className="min-h-[72px]" />;
  const numeric = f.type === 'number' || f.type === 'currency';
  return <Input type={numeric ? 'number' : 'text'} min={numeric ? 0 : undefined} step={f.type === 'currency' ? '1' : undefined}
    value={value ?? ''} onChange={(e) => set(e.target.value)} placeholder={f.placeholder} className={cn('bg-card', f.mono && 'font-mono', error && 'border-destructive')} />;
}

/** One section's fields in a two-column grid — inputs in edit mode, read-only values otherwise. */
export default function RecordFields({ fields, values, set, edit, isNew, donors, donorName, errors = {} }) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-5 gap-y-4 [&_input]:bg-card">
      {fields.map((f) => {
        const v = values[f.k];
        if (!edit && f.type === 'description' && !v) return null;
        if (edit && isNew && f.type === 'description') return (
          <div key={f.k} className="sm:col-span-2"><Editor f={f} value={v} set={(x) => set(f.k, x)} isNew /></div>
        );
        const display = f.type === 'select' ? (v ? <AssetBadge value={v} options={f.options} /> : '') : displayValue(f, v, donorName);
        return (
          <AssetField key={f.k} label={f.label} required={f.required} edit={edit} full={f.full} display={display} error={errors[f.k]}>
            <Editor f={f} value={v} set={(x) => set(f.k, x)} donors={donors} isNew={isNew} error={errors[f.k]} />
          </AssetField>
        );
      })}
    </div>
  );
}