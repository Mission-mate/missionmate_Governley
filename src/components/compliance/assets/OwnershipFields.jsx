import React from 'react';
import ColoredSelect from '@/components/shared/ColoredSelect';
import DateField from '@/components/ui/DateField';
import { OWNERSHIP_OPTIONS, fmtDate } from '@/lib/assetRegister';
import AssetField from './AssetField';
import AssetBadge from './AssetBadge';

/** Ownership select plus the Purchase or Lease dates it reveals. Renders inside a parent grid. */
export default function OwnershipFields({ values, set, edit }) {
  const dateField = (label, key) => (
    <AssetField label={label} edit={edit} display={fmtDate(values[key])}>
      <DateField value={values[key] || ''} onChange={(v) => set(key, v)} />
    </AssetField>
  );
  return (
    <>
      <AssetField label="Ownership" edit={edit} display={values.ownership && <AssetBadge value={values.ownership} options={OWNERSHIP_OPTIONS} />}>
        <ColoredSelect value={values.ownership || ''} onChange={(v) => set('ownership', v)} options={OWNERSHIP_OPTIONS} />
      </AssetField>
      {values.ownership === 'Owned' && dateField('Purchase Date', 'purchase_date')}
      {values.ownership === 'Leased' && (
        <>
          {dateField('Lease Start Date', 'lease_start_date')}
          {dateField('Lease End Date', 'lease_end_date')}
        </>
      )}
    </>
  );
}