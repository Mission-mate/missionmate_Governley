import React from 'react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { cn } from '@/lib/utils';
import { PAYMENT_METHODS } from '@/lib/membershipStructures';

// Accepted payment methods (multi-select) with conditional Bank Transfer and
// Online Payment configuration.
export default function PaymentMethodsConfig({ form, setForm }) {
  const methods = form.payment_methods || [];
  const set = (key) => (e) => setForm((f) => ({ ...f, [key]: e.target.value }));

  const toggle = (m) => setForm((f) => {
    const cur = f.payment_methods || [];
    return { ...f, payment_methods: cur.includes(m) ? cur.filter((x) => x !== m) : [...cur, m] };
  });

  const hasBank = methods.includes('Bank Transfer');
  const hasOnline = methods.includes('Online Payment');

  // Per-tier / per-year links replace the single link when the plan is
  // tiered / multi-year priced.
  const perTierLinks = form.fee_type === 'Tiered' && form.has_tiers;
  const perYearLinks = form.fee_type === 'Multi-year' && form.has_multi_year;
  const showSingleLink = hasOnline && !perTierLinks && !perYearLinks;
  const onlineType = form.online_payment_type === 'both' ? 'both' : 'one_time';

  return (
    <div className="space-y-4">
      <div>
        <Label className="mb-1 block text-sm font-semibold">Accepted Payment Methods</Label>
        <p className="text-xs text-muted-foreground mb-3">
          How will this membership fee be collected? Accepted payment methods will be shown to members during membership registration.
        </p>
        <div className="grid grid-cols-2 gap-2.5">
          {PAYMENT_METHODS.map((m) => (
            <label
              key={m}
              className="flex items-center gap-2.5 rounded-lg border border-border p-3 cursor-pointer hover:bg-muted/40 transition-colors"
            >
              <Checkbox checked={methods.includes(m)} onCheckedChange={() => toggle(m)} />
              <span className="text-sm text-foreground">{m}</span>
            </label>
          ))}
        </div>
      </div>

      {hasBank && (
        <div className="rounded-xl border border-border p-4 space-y-4">
          <div>
            <p className="text-sm font-semibold text-foreground">Bank Transfer Details</p>
            <p className="text-xs text-muted-foreground mt-0.5">
              Shown to members during registration so they can pay by bank transfer.
            </p>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label className="mb-1.5 block text-sm">Account Name <span className="text-destructive">*</span></Label>
              <Input value={form.bank_account_name} onChange={set('bank_account_name')} placeholder="Account name" />
            </div>
            <div>
              <Label className="mb-1.5 block text-sm">BSB <span className="text-destructive">*</span></Label>
              <Input value={form.bank_bsb} onChange={set('bank_bsb')} placeholder="000-000" />
            </div>
            <div>
              <Label className="mb-1.5 block text-sm">Account Number <span className="text-destructive">*</span></Label>
              <Input value={form.bank_account_number} onChange={set('bank_account_number')} placeholder="Account number" />
            </div>
            <div>
              <Label className="mb-1.5 block text-sm">Payment Reference <span className="text-muted-foreground font-normal">(Optional)</span></Label>
              <Input value={form.bank_payment_reference} onChange={set('bank_payment_reference')} placeholder="e.g. Member name" />
            </div>
          </div>

          <label className="flex items-center gap-2.5 cursor-pointer pt-1">
            <Checkbox
              checked={!!form.show_pay_id}
              onCheckedChange={(v) => setForm((f) => ({ ...f, show_pay_id: !!v }))}
            />
            <span className="text-sm text-foreground">Show PayID details</span>
          </label>
          {form.show_pay_id && (
            <div>
              <Label className="mb-1.5 block text-sm">PayID</Label>
              <Input value={form.pay_id} onChange={set('pay_id')} placeholder="Email or phone linked to PayID" />
            </div>
          )}
        </div>
      )}

      {hasOnline && (
        <div className="rounded-xl border border-border p-4 space-y-4">
          <div>
            <p className="text-sm font-semibold text-foreground">Online Payment</p>
            <p className="text-xs text-muted-foreground mt-0.5">
              Paste your payment URL. Members will use this link to pay for the membership.
            </p>
          </div>

          {/* One-time vs. recurrent selection */}
          <div className="space-y-2.5">
            {[
              {
                value: 'one_time',
                title: 'One-time membership payment only',
                desc: 'Members pay a single, non-recurring fee via online payment.',
              },
              {
                value: 'both',
                title: 'Both one-time and recurrent membership payments',
                desc: 'Members can choose a single payment or an auto-rebilling subscription.',
              },
            ].map((opt) => {
              const active = onlineType === opt.value;
              return (
                <label
                  key={opt.value}
                  className={cn(
                    'flex items-start gap-2.5 rounded-lg border p-3 cursor-pointer transition-colors',
                    active ? 'border-primary bg-primary/5 ring-1 ring-primary' : 'border-border hover:border-primary/40'
                  )}
                >
                  <input
                    type="radio"
                    name="online_payment_type"
                    checked={active}
                    onChange={() => setForm((f) => ({ ...f, online_payment_type: opt.value }))}
                    className="mt-0.5 accent-primary"
                  />
                  <span>
                    <span className={cn('block text-sm font-medium', active ? 'text-primary' : 'text-foreground')}>{opt.title}</span>
                    <span className="block text-xs text-muted-foreground mt-0.5">{opt.desc}</span>
                  </span>
                </label>
              );
            })}
          </div>

          {(perTierLinks || perYearLinks) ? (
            <p className="text-xs text-muted-foreground">
              Set a payment link for each {perTierLinks ? 'tier' : 'multi-year option'} in the fee section above.
            </p>
          ) : (
            <div className="space-y-4">
              <div>
                <Label className="mb-1 block text-sm">One-time Payment Link <span className="text-destructive">*</span></Label>
                <p className="text-xs text-muted-foreground mb-1.5">
                  Link members use to pay a single, non-recurring membership fee.
                </p>
                <Input value={form.one_time_payment_link} onChange={set('one_time_payment_link')} placeholder="https://..." />
              </div>

              {onlineType === 'both' && (
                <div>
                  <Label className="mb-1 block text-sm">Recurrent Payment Link <span className="text-destructive">*</span></Label>
                  <p className="text-xs text-muted-foreground mb-1.5">
                    Link members use to set up an auto-rebilling membership subscription.
                  </p>
                  <Input value={form.recurrent_payment_link} onChange={set('recurrent_payment_link')} placeholder="https://..." />
                </div>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
}