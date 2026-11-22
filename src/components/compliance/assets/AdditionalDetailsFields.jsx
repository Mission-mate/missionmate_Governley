import React from 'react';
import { Input } from '@/components/ui/input';
import ColoredSelect from '@/components/shared/ColoredSelect';
import DateField from '@/components/ui/DateField';
import { CONDITION_OPTIONS, fmtDate, fmtMoney } from '@/lib/assetRegister';
import AssetField from './AssetField';
import AssetBadge from './AssetBadge';
import OwnershipFields from './OwnershipFields';

export default function AdditionalDetailsFields({ values, set, edit }) {
  const text = (label, key, tooltip, placeholder) => (
    <AssetField label={label} tooltip={tooltip} edit={edit} display={values[key]}>
      <Input value={values[key] || ''} onChange={(e) => set(key, e.target.value)} placeholder={placeholder} />
    </AssetField>
  );
  const money = (label, key) => (
    <AssetField label={label} edit={edit} display={fmtMoney(values[key])}>
      <Input type="number" min="0" step="0.01" value={values[key] ?? ''} onChange={(e) => set(key, e.target.value)} placeholder="0.00" />
    </AssetField>
  );
  const date = (label, key) => (
    <AssetField label={label} edit={edit} display={fmtDate(values[key])}>
      <DateField value={values[key] || ''} onChange={(v) => set(key, v)} />
    </AssetField>
  );

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-5 gap-y-4">
      {text('Asset Manager', 'asset_manager', 'The person with managerial responsibility for the asset', 'e.g., Operations Director')}
      {text('Asset User', 'asset_user', 'The person the asset is assigned to use', 'e.g., Project Officer')}
      <OwnershipFields values={values} set={set} edit={edit} />
      {money('Asset Value', 'asset_value')}
      {date('Warranty Expiry', 'warranty_expiry')}
      <AssetField label="Condition" edit={edit} display={values.condition && <AssetBadge value={values.condition} options={CONDITION_OPTIONS} />}>
        <ColoredSelect value={values.condition || ''} onChange={(v) => set('condition', v)} options={CONDITION_OPTIONS} />
      </AssetField>
      {values.status === 'Disposed' && (
        <>
          {date('Date of Disposal', 'date_of_disposal')}
          {money('Sale Proceeds', 'sale_proceeds')}
        </>
      )}
    </div>
  );
}