import React from 'react';
import { Plus, Trash2 } from 'lucide-react';
import GiftField from '@/components/compliance/gifts/GiftField';
import { MAX_ADDITIONAL_PARTIES, PARTY_KEYS, emptyParty } from '@/lib/contractRegister';

const hasData = (p) => PARTY_KEYS.some((k) => String(p[k] || '').trim());

/** Up to three extra party sets after a divider; View mode shows only populated sets. */
export default function AdditionalParties({ values, setForm, edit }) {
  const parties = values.additional_parties || [];
  const update = (next) => setForm((f) => ({ ...f, additional_parties: next }));
  const shown = edit ? parties.map((p, i) => [p, i]) : parties.map((p, i) => [p, i]).filter(([p]) => hasData(p));

  return (
    <>
      {shown.map(([p, i]) => {
        const set = (k, v) => update(parties.map((x, j) => (j === i ? { ...x, [k]: v } : x)));
        const fp = { values: p, set, edit };
        return (
          <React.Fragment key={i}>
            <div className="col-span-2 flex items-center gap-3 pt-1">
              <div className="h-px flex-1 bg-border" />
              <span className="text-xs font-medium text-muted-foreground">Additional Party {i + 1}</span>
              <div className="h-px flex-1 bg-border" />
              {edit && (
                <button type="button" title="Remove party" onClick={() => update(parties.filter((_, j) => j !== i))}
                  className="text-muted-foreground hover:text-destructive transition-colors">
                  <Trash2 className="w-4 h-4" />
                </button>
              )}
            </div>
            <GiftField {...fp} k="party_name" label="Counterparty" placeholder="e.g., ABC Pty Ltd" />
            <GiftField {...fp} k="party_contact" label="Contact Person" placeholder="e.g., Jane Smith" />
            <GiftField {...fp} k="party_email" label="Email" placeholder="e.g., jane@abc.com.au" />
            <GiftField {...fp} k="party_phone" label="Phone" placeholder="e.g., 08 8900 0000" />
          </React.Fragment>
        );
      })}
      {edit && parties.length < MAX_ADDITIONAL_PARTIES && (
        <button type="button" onClick={() => update([...parties, emptyParty()])}
          className="col-span-2 inline-flex items-center gap-1.5 text-sm font-medium text-primary hover:text-primary/80 transition-colors w-fit">
          <Plus className="w-4 h-4" /> Add Additional Parties
        </button>
      )}
    </>
  );
}