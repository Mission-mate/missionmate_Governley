import React from 'react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import InfoTooltip from '@/components/risk/InfoTooltip';

const FIELDS = [
  ['business_function', 'Business Function', 'e.g., HR, Finance'],
  ['information_owner', 'Information Owner', 'e.g., HR Partner, CFO'],
  ['retention_requirement', 'Information Retention Requirement', 'e.g., 7 years', 'How long do we keep it'],
];

/** Information Ownership fields — editable inputs, or read-only values when `edit` is false. */
export default function InfoOwnershipFields({ values, set, edit }) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
      {FIELDS.map(([k, label, placeholder, tip]) => (
        <div key={k} className="space-y-1.5">
          <div className="flex items-center gap-1.5">
            <Label className="text-xs text-muted-foreground">{label}</Label>
            {tip && <InfoTooltip text={tip} />}
          </div>
          {edit
            ? <Input value={values[k]} onChange={(e) => set(k, e.target.value)} placeholder={placeholder} className="bg-card" />
            : <p className="text-sm text-foreground">{values[k] || '—'}</p>}
        </div>
      ))}
    </div>
  );
}