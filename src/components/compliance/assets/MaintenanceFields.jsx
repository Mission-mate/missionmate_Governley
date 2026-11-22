import React from 'react';
import { Input } from '@/components/ui/input';
import DateField from '@/components/ui/DateField';
import AutoGrowTextarea from '@/components/shared/AutoGrowTextarea';
import ColoredSelect from '@/components/shared/ColoredSelect';
import { fmtDate, fmtMoney } from '@/lib/assetRegister';
import { MAINTENANCE_TYPE_OPTIONS } from '@/lib/maintenanceTypes';
import AssetField from './AssetField';
import AssetBadge from './AssetBadge';

/** Maintenance entry fields in two muted groups; the same layout renders view-only or editable. */
export default function MaintenanceFields({ form, set, errors, edit }) {
  return (
    <div className="space-y-4">
      <div className="rounded-xl bg-muted p-5 space-y-4">
        <AssetField label="Title" required edit={edit} error={errors.title} display={form.title}>
          <Input value={form.title} onChange={(e) => set('title', e.target.value)} placeholder="e.g. Annual service" className={errors.title ? 'border-destructive bg-card' : 'bg-card'} />
        </AssetField>
        <AssetField label="Description" edit={edit} display={form.description}>
          <AutoGrowTextarea value={form.description} onChange={(e) => set('description', e.target.value)} placeholder="What was done?" className="min-h-[72px] bg-card" />
        </AssetField>
      </div>
      <div className="rounded-xl bg-muted p-5">
        <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-4">Maintenance Details</p>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-5 gap-y-4">
          <AssetField label="Date" required edit={edit} error={errors.date} display={form.date && fmtDate(form.date)}>
            <DateField value={form.date} onChange={(v) => set('date', v)} />
          </AssetField>
          <AssetField label="Type" required edit={edit} error={errors.type}
            display={form.type && <AssetBadge value={form.type} options={MAINTENANCE_TYPE_OPTIONS} />}>
            <ColoredSelect value={form.type} onChange={(v) => set('type', v)} options={MAINTENANCE_TYPE_OPTIONS} placeholder="Select type..." invalid={!!errors.type} />
          </AssetField>
          <AssetField label="Provider" edit={edit} display={form.provider}>
            <Input value={form.provider} onChange={(e) => set('provider', e.target.value)} placeholder="e.g. ABC Servicing" className="bg-card" />
          </AssetField>
          <AssetField label="Cost" edit={edit} display={form.cost !== '' && form.cost != null ? fmtMoney(form.cost) : ''}>
            <Input type="number" min="0" step="0.01" value={form.cost} onChange={(e) => set('cost', e.target.value)} placeholder="0.00" className="bg-card" />
          </AssetField>
        </div>
      </div>
    </div>
  );
}