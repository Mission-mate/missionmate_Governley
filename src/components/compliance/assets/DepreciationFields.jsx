import React from 'react';
import { Input } from '@/components/ui/input';
import ColoredSelect from '@/components/shared/ColoredSelect';
import DateField from '@/components/ui/DateField';
import {
  DEPRECIATION_METHODS, CALCULATION_METHODS, LIFE_UNITS, isDepreciating, calcDepreciationEnd, fmtDate,
} from '@/lib/assetRegister';
import AssetField from './AssetField';

export default function DepreciationFields({ values, set, edit, errors = {} }) {
  const dep = isDepreciating(values.depreciation_method);
  const end = edit ? calcDepreciationEnd(values) : values.depreciation_end_date;
  const life = values.effective_life_value ? `${values.effective_life_value} ${values.effective_life_unit || 'Years'}` : '';

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-5 gap-y-4">
      <AssetField label="Depreciation Method" edit={edit} display={values.depreciation_method}>
        <ColoredSelect value={values.depreciation_method || ''} onChange={(v) => set('depreciation_method', v)} options={DEPRECIATION_METHODS} />
      </AssetField>
      {dep && (
        <>
          <AssetField label="Depreciation Start Date" edit={edit} display={fmtDate(values.depreciation_start_date)}>
            <DateField value={values.depreciation_start_date || ''} onChange={(v) => set('depreciation_start_date', v)} />
          </AssetField>
          <AssetField label="Calculation Method" edit={edit} display={values.calculation_method}>
            <ColoredSelect value={values.calculation_method || ''} onChange={(v) => set('calculation_method', v)} options={CALCULATION_METHODS} />
          </AssetField>
          {values.calculation_method === 'Depreciation Rate' && (
            <AssetField label="Depreciation Rate" edit={edit} error={errors.depreciation_rate} display={values.depreciation_rate != null && values.depreciation_rate !== '' ? `${values.depreciation_rate}%` : ''}>
              <div className="relative">
                <Input type="number" min="0" max="100" step="0.01" value={values.depreciation_rate ?? ''} onChange={(e) => set('depreciation_rate', e.target.value)} className="pr-8" />
                <span className="absolute right-3 top-1/2 -translate-y-1/2 text-sm text-muted-foreground">%</span>
              </div>
            </AssetField>
          )}
          {values.calculation_method === 'Effective Life' && (
            <AssetField label="Effective Life" edit={edit} error={errors.effective_life_value} display={life}>
              <div className="flex gap-2">
                <Input type="number" min="0" value={values.effective_life_value ?? ''} onChange={(e) => set('effective_life_value', e.target.value)} className="flex-1" />
                <div className="w-28 shrink-0">
                  <ColoredSelect value={values.effective_life_unit || 'Years'} onChange={(v) => set('effective_life_unit', v)} options={LIFE_UNITS} allowClear={false} />
                </div>
              </div>
            </AssetField>
          )}
          <AssetField label="Depreciation End Date" display={fmtDate(end)} hint={edit ? 'Auto-calculated from start date and life' : ''} />
        </>
      )}
    </div>
  );
}