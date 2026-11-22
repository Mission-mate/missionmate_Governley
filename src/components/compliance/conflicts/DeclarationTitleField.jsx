import React from 'react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

/** Compliance-only Declaration Title field, shown before the description. */
export default function DeclarationTitleField({ value, onChange, readOnly }) {
  return (
    <div>
      <Label className="mb-1 block text-xs font-medium text-muted-foreground">
        Declaration Title {!readOnly && <span className="text-destructive">*</span>}
      </Label>
      <Input value={value || ''} onChange={(e) => onChange(e.target.value)} disabled={readOnly} placeholder="Enter declaration title..." className="bg-white" />
    </div>
  );
}