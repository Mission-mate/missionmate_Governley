import React from 'react';
import { Label } from '@/components/ui/label';
import RichTextField from '@/components/risk/RiskRichTextField';

export default function RiskStepMonitoring({ form, update }) {
  return (
    <div className="space-y-5">
      <div>
        <Label className="mb-1 block text-sm font-medium text-foreground">Monitoring Method</Label>
        <RichTextField
          value={form.monitoring_method ?? ''}
          onChange={(v) => update({ monitoring_method: v })}
          placeholder="e.g. Quarterly KPI tracking, internal audit, periodic review"
          minHeight={120}
        />
      </div>
    </div>
  );
}