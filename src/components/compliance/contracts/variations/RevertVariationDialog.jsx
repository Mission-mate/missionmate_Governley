import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import ModalOverlay from '@/components/ui/ModalOverlay';
import { fmtDate } from '@/lib/assetRegister';
import { formatMoney } from '@/lib/giftRegister';

/** After a typed DELETE on the Current variation: revert its applied changes or delete only. */
import { guardSave } from '@/lib/saveGuard';

export default function RevertVariationDialog({ change, contract, onChoose, onClose }) {
  const [busy, setBusy] = useState(null);
  useEffect(() => { if (change) setBusy(null); }, [change]);
  const choose = guardSave(setBusy, async (revert) => { setBusy(revert ? 'revert' : 'delete'); await onChoose(revert); setBusy(null); }, 'Could not delete the variation');
  const newValue = Number(contract.value || 0) + Number(change?.delta || 0);
  const showExpiry = change && (change.expiry || change.clearExpiry);

  return (
    <ModalOverlay isOpen={!!change} onClose={onClose} className="w-full max-w-md" zIndex={320}>
      {change && (
        <div className="bg-card rounded-xl shadow-2xl p-6">
          <h2 className="text-lg font-bold text-foreground mb-2">Revert contract changes?</h2>
          <p className="text-sm text-muted-foreground mb-4">This is the current variation and its changes were applied to {contract.contract_code}. No other variation will be made current.</p>
          <div className="rounded-xl bg-muted p-4 space-y-2 mb-5 text-sm">
            {!!change.delta && (
              <div className="flex justify-between gap-4">
                <span className="text-muted-foreground">Contract Value</span>
                <span className="tabular-nums text-foreground">{formatMoney(contract.value || 0)} → {formatMoney(newValue)}</span>
              </div>
            )}
            {showExpiry && (
              <div className="flex justify-between gap-4">
                <span className="text-muted-foreground">Expiry Date</span>
                <span className="tabular-nums text-foreground">{fmtDate(contract.expiry_date) || '—'} → {fmtDate(change.expiry) || '—'}</span>
              </div>
            )}
          </div>
          <div className="flex items-center justify-end gap-3">
            <Button variant="outline" onClick={() => choose(false)} disabled={!!busy}>{busy === 'delete' ? 'Deleting...' : 'Delete only'}</Button>
            <Button variant="destructive" onClick={() => choose(true)} disabled={!!busy}>{busy === 'revert' ? 'Reverting...' : 'Revert & delete'}</Button>
          </div>
        </div>
      )}
    </ModalOverlay>
  );
}