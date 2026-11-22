import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import ModalOverlay from '@/components/ui/ModalOverlay';
import { fmtDate } from '@/lib/assetRegister';
import { formatMoney } from '@/lib/giftRegister';
import { formatSignedMoney } from './variationFormat';

/** Asks whether a variation's value / expiry changes should also update the contract. */
export default function ApplyVariationDialog({ change, contract, onChoose, onClose }) {
  const [busy, setBusy] = useState(null);
  useEffect(() => { if (change) setBusy(null); }, [change]);
  const choose = async (apply) => { setBusy(apply ? 'apply' : 'record'); try { await onChoose(apply); } finally { setBusy(null); } };
  const newValue = Number(contract.value || 0) + Number(change?.delta || 0);

  return (
    <ModalOverlay isOpen={!!change} onClose={onClose} className="w-full max-w-md" zIndex={320}>
      {change && (
        <div className="bg-card rounded-xl shadow-2xl p-6">
          <h2 className="text-lg font-bold text-foreground mb-2">Update the contract?</h2>
          <p className="text-sm text-muted-foreground mb-4">This variation changes the contract. Apply these changes to {contract.contract_code}, or record the variation only.</p>
          <div className="rounded-xl bg-muted p-4 space-y-2 mb-4 text-sm">
            {!!change.delta && (
              <div className="flex justify-between gap-4">
                <span className="text-muted-foreground">Contract Value ({formatSignedMoney(change.delta)})</span>
                <span className="tabular-nums text-foreground">{formatMoney(contract.value || 0)} → {formatMoney(newValue)}</span>
              </div>
            )}
            {change.expiry && (
              <div className="flex justify-between gap-4">
                <span className="text-muted-foreground">Expiry Date</span>
                <span className="tabular-nums text-foreground">{fmtDate(contract.expiry_date) || '—'} → {fmtDate(change.expiry)}</span>
              </div>
            )}
          </div>
          {!!change.delta && <p className="text-xs text-muted-foreground mb-5">After applying, update the payment schedule to match the new value.</p>}
          <div className="flex items-center justify-end gap-3">
            <Button variant="outline" onClick={() => choose(false)} disabled={!!busy}>{busy === 'record' ? 'Saving...' : 'Record only'}</Button>
            <Button onClick={() => choose(true)} disabled={!!busy}>{busy === 'apply' ? 'Applying...' : 'Apply to contract'}</Button>
          </div>
        </div>
      )}
    </ModalOverlay>
  );
}