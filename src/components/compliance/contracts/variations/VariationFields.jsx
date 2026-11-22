import React from 'react';
import GiftField from '@/components/compliance/gifts/GiftField';
import { formatMoney } from '@/lib/giftRegister';
import { formatSignedMoney } from './variationFormat';
import { VARIATION_STATUS_OPTIONS } from '@/lib/contractVariations';

/** Variation fields; read-only values when !edit. */
export default function VariationFields({ values, set, edit, contract, errors }) {
  const p = { values, set, edit, errors };
  return (
    <>
      <section className="rounded-xl bg-muted p-5">
        <div className="grid grid-cols-2 gap-4">
          <GiftField {...p} k="title" label="Variation Title *" placeholder="e.g., Additional client funding" full />
          <GiftField {...p} k="description" label="Description" type="long" placeholder="e.g., Extra funding for 40 additional clients" full />
        </div>
      </section>
      <section className="rounded-xl bg-muted p-5">
        <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-4">Variation Details</p>
        <div className="grid grid-cols-2 gap-4">
          <GiftField {...p} k="variation_date" label="Variation Date" type="date" />
          <GiftField {...p} k="approved_by" label="Approved By" placeholder="e.g., CEO" />
          <div className="space-y-1 col-span-2">
            <GiftField {...p} k="status" label="Status" type="select" options={VARIATION_STATUS_OPTIONS} />
            {edit && <p className="text-xs text-muted-foreground">Making this variation Current supersedes all other variations. Only a Current variation can update the contract.</p>}
          </div>
          {edit ? (
            <div className="space-y-1">
              <GiftField {...p} k="change_in_value" label="Change in Value ($)" placeholder="0" />
              <p className="text-xs text-muted-foreground">Use a minus sign for a reduction.</p>
            </div>
          ) : (
            <div className="space-y-1.5">
              <p className="text-xs text-muted-foreground">Change in Value</p>
              <p className="text-sm text-foreground tabular-nums">{formatSignedMoney(values.change_in_value)}</p>
            </div>
          )}
          <div className="space-y-1">
            <GiftField {...p} k="new_expiry_date" label="New Expiry Date" type="date" />
            {edit && <p className="text-xs text-muted-foreground">Leave blank if the end date does not change.</p>}
          </div>
        </div>
        {edit && contract.has_financial_value && (
          <p className="text-xs text-muted-foreground mt-4">Current contract value {formatMoney(contract.value || 0)}. If applied, the payment schedule must be updated to match the new value.</p>
        )}
      </section>
    </>
  );
}