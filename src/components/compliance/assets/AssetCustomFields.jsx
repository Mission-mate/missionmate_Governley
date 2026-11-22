import React from 'react';
import StrategyCustomFields from '@/components/strategy/customFields/StrategyCustomFields';

/** Custom column values for one asset — editable in edit mode, read-only otherwise. */
export default function AssetCustomFields({ values, set, edit, columns }) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-5">
      <StrategyCustomFields
        columns={columns}
        values={values.custom_fields || {}}
        editing={edit}
        onChange={(v) => set('custom_fields', v)}
        inputClassName="h-9 bg-card"
      />
    </div>
  );
}