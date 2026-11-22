import React from 'react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

// Read-only tier list (names come from Page 1) with an editable fee per tier,
// and — when Online Payment is accepted — an optional per-tier payment link.
// When both one-time and recurrent payments are accepted, each tier collects a
// separate one-time and recurrent payment link.
export default function TierFeeList({ form, setForm, showLinks, onlineType = 'one_time' }) {
  const tiers = form.tiers || [];
  const isBoth = onlineType === 'both';
  const update = (id, patch) =>
    setForm((f) => ({ ...f, tiers: (f.tiers || []).map((t) => (t.id === id ? { ...t, ...patch } : t)) }));

  if (!form.has_tiers || tiers.length === 0) {
    return (
      <p className="text-sm text-muted-foreground rounded-lg border border-dashed border-border p-3">
        Add categories/tiers on the Membership Details step to set a fee for each.
      </p>
    );
  }

  return (
    <div className="space-y-3">
      {tiers.map((t) => {
        const showTierLinks = showLinks && Number(t.fee_amount) > 0;
        return (
          <div key={t.id} className="rounded-lg border border-border bg-muted/20 p-4 space-y-4">
            {/* Tier name + fee */}
            <div className="flex items-start gap-3">
              <div className="flex-1 min-w-0 pt-1">
                <span className="block text-sm font-semibold text-foreground truncate">
                  {t.name || 'Untitled tier'}
                </span>
                <p className="text-[11px] text-muted-foreground mt-0.5">
                  Tiers without a fee will appear as Free
                </p>
              </div>
              <div className="relative w-36 shrink-0">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm text-muted-foreground">$</span>
                <Input
                  type="number" min="0" step="0.01"
                  value={t.fee_amount ?? 0}
                  onChange={(e) => update(t.id, { fee_amount: e.target.value })}
                  placeholder="0.00" className="pl-7"
                />
              </div>
            </div>

            {/* Payment links */}
            {showTierLinks && (
              <div className="space-y-4 border-t border-border pt-4">
                <div>
                  <Label className="mb-1 block text-sm font-medium text-foreground">
                    One-time Payment Link <span className="text-destructive">*</span>
                  </Label>
                  <p className="text-xs text-muted-foreground mb-2">
                    Link members use to pay a single, non-recurring membership fee for this tier.
                  </p>
                  <Input
                    value={t.one_time_payment_link ?? t.payment_link ?? ''}
                    onChange={(e) => update(t.id, isBoth
                      ? { one_time_payment_link: e.target.value }
                      : { one_time_payment_link: e.target.value, payment_link: e.target.value })}
                    placeholder="https://..."
                  />
                </div>
                {isBoth && (
                  <div>
                    <Label className="mb-1 block text-sm font-medium text-foreground">
                      Recurrent Payment Link <span className="text-destructive">*</span>
                    </Label>
                    <p className="text-xs text-muted-foreground mb-2">
                      Link members use to set up an auto-rebilling membership subscription for this tier.
                    </p>
                    <Input
                      value={t.recurrent_payment_link || ''}
                      onChange={(e) => update(t.id, { recurrent_payment_link: e.target.value })}
                      placeholder="https://..."
                    />
                  </div>
                )}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}