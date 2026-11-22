import React from 'react';
import { Label } from '@/components/ui/label';
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select';
import {
  RENEWAL_PERIODS, RENEWAL_CALCULATIONS, GRACE_PERIOD_OPTIONS, AFTER_GRACE_OPTIONS,
} from '@/lib/membershipStructures';
import SectionCard from '@/components/shared/SectionCard';
import RenewalIntervalRow from '@/components/settings/membership/RenewalIntervalRow';

const MONTHS = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December',
];
const DAYS = Array.from({ length: 31 }, (_, i) => i + 1);

export default function StructureStepRenewal({ form, setForm }) {
  const setVal = (key) => (v) => setForm((f) => ({ ...f, [key]: v }));
  const isLifetime = form.renewal_period === 'Lifetime (No Expiration)';
  const isFixedDate = form.renewal_calculation === 'Fixed renewal date';

  return (
    <SectionCard className="space-y-6">
      <div>
        <Label className="mb-1.5 block text-sm">Renewal Period <span className="text-destructive">*</span></Label>
        <Select value={form.renewal_period} onValueChange={setVal('renewal_period')}>
          <SelectTrigger><SelectValue /></SelectTrigger>
          <SelectContent>
            {RENEWAL_PERIODS.map((p) => <SelectItem key={p} value={p}>{p}</SelectItem>)}
          </SelectContent>
        </Select>
        <p className="text-xs text-muted-foreground mt-1.5">
          How often this membership renews.
        </p>
      </div>

      {form.renewal_period === 'Every' && (
        <RenewalIntervalRow form={form} setForm={setForm} />
      )}

      {!isLifetime && (
        <>
          <div>
            <Label className="mb-1.5 block text-sm">Renewal Calculation <span className="text-destructive">*</span></Label>
            <Select value={form.renewal_calculation} onValueChange={setVal('renewal_calculation')}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                {RENEWAL_CALCULATIONS.map((c) => <SelectItem key={c} value={c}>{c}</SelectItem>)}
              </SelectContent>
            </Select>
            <p className="text-xs text-muted-foreground mt-1.5">
              How the expiry date is worked out for members on this plan.
            </p>
          </div>

          {isFixedDate && (
            <div className="rounded-xl bg-background p-4 grid grid-cols-2 gap-4">
              <div>
                <Label className="mb-1.5 block text-sm">Renewal Day</Label>
                <Select
                  value={String(form.specific_expiration_day || 1)}
                  onValueChange={(v) => setForm((f) => ({ ...f, specific_expiration_day: Number(v) }))}
                >
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent className="max-h-64">
                    {DAYS.map((d) => <SelectItem key={d} value={String(d)}>{d}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label className="mb-1.5 block text-sm">Renewal Month</Label>
                <Select
                  value={String(form.specific_expiration_month || 1)}
                  onValueChange={(v) => setForm((f) => ({ ...f, specific_expiration_month: Number(v) }))}
                >
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent className="max-h-64">
                    {MONTHS.map((m, i) => <SelectItem key={m} value={String(i + 1)}>{m}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
            </div>
          )}

          <div>
            <Label className="mb-1.5 block text-sm">Grace Period <span className="text-destructive">*</span></Label>
            <Select
              value={String(form.grace_period_days ?? 0)}
              onValueChange={(v) => setForm((f) => ({ ...f, grace_period_days: Number(v) }))}
            >
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                {GRACE_PERIOD_OPTIONS.map((g) => (
                  <SelectItem key={g.value} value={String(g.value)}>{g.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            <p className="text-xs text-muted-foreground mt-1.5">
              Extra time after expiry before the membership is actioned.
            </p>
          </div>

          <div>
            <Label className="mb-1.5 block text-sm">After Grace Period <span className="text-destructive">*</span></Label>
            <Select value={form.after_grace_period} onValueChange={setVal('after_grace_period')}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                {AFTER_GRACE_OPTIONS.map((o) => <SelectItem key={o} value={o}>{o}</SelectItem>)}
              </SelectContent>
            </Select>
            <p className="text-xs text-muted-foreground mt-1.5">
              Applied automatically each night once the grace period has passed.
            </p>
          </div>
        </>
      )}

      {isLifetime && (
        <p className="text-sm text-muted-foreground rounded-xl bg-background p-4">
          Lifetime memberships never expire, so renewal calculation and grace period settings don't apply.
        </p>
      )}
    </SectionCard>
  );
}