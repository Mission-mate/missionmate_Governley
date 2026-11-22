import React from 'react';
import { Input } from '@/components/ui/input';
import AutoGrowTextarea from '@/components/shared/AutoGrowTextarea';
import ColoredSelect from '@/components/shared/ColoredSelect';
import { cn } from '@/lib/utils';
import { ASSET_STATUS_OPTIONS } from '@/lib/assetRegister';
import AssetField from './AssetField';
import AssetBadge from './AssetBadge';
import AddDescriptionToggle from './AddDescriptionToggle';

/** Asset ID, title, serial number, type, location, status and description. */
export default function AssetDetailsFields({ values, set, edit, options, idError: idErrorProp, onIdBlur, descriptionToggle, errors = {} }) {
  const idError = idErrorProp || errors.asset_id;
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-5 gap-y-4">
      <AssetField label="Asset ID" required edit={edit} display={values.asset_id} error={idError}>
        <Input
          value={values.asset_id || ''}
          onChange={(e) => set('asset_id', e.target.value)}
          onBlur={onIdBlur}
          className={cn(idError && 'border-destructive')}
        />
      </AssetField>
      <AssetField label="Asset Title" required edit={edit} display={values.title} error={errors.title}>
        <Input value={values.title || ''} onChange={(e) => set('title', e.target.value)} placeholder="e.g. Dell Latitude Laptop" />
      </AssetField>
      <AssetField label="Serial Number" edit={edit} display={values.serial_number}>
        <Input value={values.serial_number || ''} onChange={(e) => set('serial_number', e.target.value)} placeholder="Optional" />
      </AssetField>
      <AssetField label="Asset Type" tooltip="Create custom asset types in customiser" edit={edit} display={values.asset_type}>
        <ColoredSelect value={values.asset_type || ''} onChange={(v) => set('asset_type', v)} options={options.asset_types} placeholder="Select type..." />
      </AssetField>
      <AssetField label="Location" tooltip="Create custom locations in customiser" edit={edit} display={values.location}>
        <ColoredSelect value={values.location || ''} onChange={(v) => set('location', v)} options={options.locations} placeholder="Select location..." />
      </AssetField>
      <AssetField label="Status" edit={edit} display={<AssetBadge value={values.status} options={ASSET_STATUS_OPTIONS} />}>
        <ColoredSelect value={values.status || ''} onChange={(v) => set('status', v || 'Active')} options={ASSET_STATUS_OPTIONS} allowClear={false} />
      </AssetField>
      {descriptionToggle ? (
        <AddDescriptionToggle value={values.description} onChange={(v) => set('description', v)} />
      ) : (
        <AssetField label="Description" full edit={edit} display={values.description}>
          <AutoGrowTextarea value={values.description || ''} onChange={(e) => set('description', e.target.value)} placeholder="Describe the asset..." className="min-h-[72px]" />
        </AssetField>
      )}
    </div>
  );
}