import React, { useState } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { saveRisk, RiskConflictError } from '@/lib/riskApi';
import RiskConflictDialog from '@/components/risk/conflict/RiskConflictDialog';

// Re-point a rejected request at the latest record, so retrying it knowingly
// replaces the newer values the user has just reviewed.
const rebase = (request, latest) => ({
  ...request,
  base: request.base && Object.fromEntries(Object.keys(request.base).map((k) => [k, latest[k] ?? null])),
  arrayOps: request.arrayOps?.map((op) => ({
    ...op,
    upserts: op.upserts?.map(({ item }) => ({
      item,
      base: (latest[op.field] || []).find((x) => x.id === item.id) || null,
    })),
  })),
});

/**
 * Conflict-aware saving for one risk.
 *
 * save(request) resolves true once saved. If someone else changed the same data,
 * it holds the request (the editor and its draft stay open) and shows the
 * conflict dialog: "Save my changes" retries against the latest record,
 * "Reload current data" loads it instead and resolves false. Other failures throw.
 */
export default function useRiskSave(riskId) {
  const qc = useQueryClient();
  const [conflict, setConflict] = useState(null);

  const save = async (request) => {
    let pending = request;
    for (;;) {
      try {
        const record = await saveRisk(riskId, pending);
        qc.setQueryData(['risk', riskId], record);
        qc.invalidateQueries({ queryKey: ['risks'] });
        return true;
      } catch (err) {
        if (!(err instanceof RiskConflictError)) throw err;
        const keepMine = await new Promise((resolve) => setConflict({ conflicts: err.conflicts, resolve }));
        setConflict(null);
        if (!keepMine) {
          qc.setQueryData(['risk', riskId], err.record);
          return false;
        }
        pending = rebase(pending, err.record);
      }
    }
  };

  const dialog = (
    <RiskConflictDialog
      conflicts={conflict?.conflicts}
      onReload={() => conflict.resolve(false)}
      onKeep={() => conflict.resolve(true)} />
  );

  return { save, dialog };
}