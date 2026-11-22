/**
 * The 'Every N Months/Years' interval row, shown directly below the Renewal
 * Period field when the 'Every' period is selected.
 */
import React from 'react';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select';
import { RENEWAL_INTERVAL_UNITS, RENEWAL_MAX_MONTHS, renewalIntervalError } from '@/lib/membershipStructures';

export default function RenewalIntervalRow({ form, setForm }) {
  const error = renewalIntervalError(form);

  return (
    <div className="rounded-xl bg-background p-4 grid grid-cols-2 gap-4">
      <div>
        <Label className="mb-1.5 block text-sm">Every <span className="text-destructive">*</span></Label>
        <Input
          type="number"
          min={1}
          max={RENEWAL_MAX_MONTHS}
          placeholder="e.g. 4"
          value={form.renewal_interval_value ?? ''}
          onChange={(e) => setForm((f) => ({ ...f, renewal_interval_value: e.target.value }))}
          aria-invalid={!!error}
          className={error ? 'border-destructive focus-visible:ring-destructive' : undefined}
        />
        {error && <p className="text-xs text-destructive mt-1.5">{error}</p>}
      </div>
      <div>
        <Label className="mb-1.5 block text-sm">Unit <span className="text-destructive">*</span></Label>
        <Select
          value={form.renewal_interval_unit || 'Months'}
          onValueChange={(v) => setForm((f) => ({ ...f, renewal_interval_unit: v }))}
        >
          <SelectTrigger><SelectValue /></SelectTrigger>
          <SelectContent>
            {RENEWAL_INTERVAL_UNITS.map((u) => <SelectItem key={u} value={u}>{u}</SelectItem>)}
          </SelectContent>
        </Select>
      </div>
    </div>
  );
}