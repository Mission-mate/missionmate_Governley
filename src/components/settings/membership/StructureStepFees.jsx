import React from 'react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select';
import { FEE_TYPES } from '@/lib/membershipStructures';
import TierFeeList from './fees/TierFeeList';
import PaymentMethodsConfig from './fees/PaymentMethodsConfig';
import SectionCard from '@/components/shared/SectionCard';

const FEE_TYPE_HELP = {
  Free: 'Members join this plan at no cost.',
  Fixed: 'A single membership fee for everyone on this plan.',
  Tiered: 'Set a different fee for each tier.',
  Custom: 'The membership fee is assessed individually. No fixed fee is shown to members.',
};

const FEE_TYPE_LABELS = {
  Free: 'Free',
  Fixed: 'Fixed fee',
  Tiered: 'Tiered fee',
  Custom: 'Manual Assessment',
};

export default function StructureStepFees({ form, setForm }) {
  const setVal = (key) => (v) => setForm((f) => ({ ...f, [key]: v }));
  const set = (key) => (e) => setForm((f) => ({ ...f, [key]: e.target.value }));

  const feeType = form.fee_type || 'Free';
  const showLinks = (form.payment_methods || []).includes('Online Payment');
  const onlineType = form.online_payment_type === 'both' ? 'both' : 'one_time';

  // Only fee types compatible with the plan's config are relevant, but we show
  // all and guide the admin instead of hiding options.
  const options = FEE_TYPES.filter((t) => {
    if (t === 'Tiered') return form.has_tiers;
    return true;
  });

  return (
    <SectionCard className="space-y-6">
      <div>
        <Label className="mb-1.5 block text-sm">Fee Type <span className="text-destructive">*</span></Label>
        <Select value={feeType} onValueChange={setVal('fee_type')}>
          <SelectTrigger><SelectValue /></SelectTrigger>
          <SelectContent>
            {options.map((t) => <SelectItem key={t} value={t}>{FEE_TYPE_LABELS[t] || t}</SelectItem>)}
          </SelectContent>
        </Select>
        <p className="text-xs text-muted-foreground mt-1.5">{FEE_TYPE_HELP[feeType]}</p>
      </div>

      {feeType === 'Fixed' && (
        <div>
          <Label className="mb-1.5 block text-sm">Membership Fee</Label>
          <div className="relative w-48">
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm text-muted-foreground">$</span>
            <Input
              type="number" min="0" step="0.01"
              value={form.fee_amount ?? 0}
              onChange={set('fee_amount')}
              placeholder="0.00" className="pl-7"
            />
          </div>
        </div>
      )}

      {feeType === 'Tiered' && (
        <div>
          <Label className="mb-2 block text-sm">Tier Fees</Label>
          <TierFeeList form={form} setForm={setForm} showLinks={showLinks} onlineType={onlineType} />
        </div>
      )}

      {feeType !== 'Free' && (
        <PaymentMethodsConfig form={form} setForm={setForm} />
      )}
    </SectionCard>
  );
}