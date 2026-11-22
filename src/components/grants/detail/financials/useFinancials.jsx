import { useCallback, useRef, useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { useToast } from '@/components/ui/use-toast';
import { GRANTS_QUERY_KEY } from '@/hooks/useGrantQueries';
import { parseAmount } from '@/lib/financials';

/**
 * Loads all FinancialEntry rows for a parent (grant/program) and exposes CRUD helpers.
 *
 * Two families of mutations are exposed on purpose:
 *  - add/update/deleteFundingRow  — Funding Schedule only. Serialized, and the
 *    only path that recalculates and writes Grant.total_amount.
 *
 * Handlers are wrapped in useCallback so their identities stay stable across
 * renders (stable prop identities), not as a re-render guard — the tables are
 * not memoized, so a parent re-render still re-renders them.
 */
export function useFinancials(parentType, parentId) {
  const qc = useQueryClient();
  const { toast } = useToast();
  const fundingQueue = useRef(Promise.resolve());
  // Counts every op currently queued OR running, so the saving state represents
  // the whole queue instead of one op (no enabled flicker between queued ops).
  const pendingFundingOps = useRef(0);
  const [isFundingSaving, setIsFundingSaving] = useState(false);

  const { data: entries = [], isLoading, ...read } = useQuery({
    queryKey: ['financial-entries', parentType, parentId],
    queryFn: () => base44.entities.FinancialEntry.filter({ parent_type: parentType, parent_id: parentId }, 'sort_order'),
    enabled: !!parentId,
  });

  const invalidateFinancials = useCallback(() => {
    qc.invalidateQueries({ queryKey: ['financial-entries', parentType, parentId] });
  }, [qc, parentType, parentId]);

  const invalidateGrant = useCallback(() => {
    if (parentType !== 'grant') return;
    qc.invalidateQueries({ queryKey: ['grant', parentId] });
    qc.invalidateQueries({ queryKey: GRANTS_QUERY_KEY });
  }, [qc, parentType, parentId]);


  // ── Funding Breakdown flow ────────────────────────────────────────────────
  // Explicit awaited server read AFTER the row mutation — deterministic, never
  // derived from React Query cache timing.
  const syncFundingTotal = useCallback(async () => {
    if (parentType !== 'grant') return;
    const latest = await base44.entities.FinancialEntry.filter({ parent_type: 'grant', parent_id: parentId, type: 'funding' });
    // A non-finite stored value contributes 0 rather than poisoning the total with NaN.
    const sum = latest.reduce((s, r) => s + (parseAmount(r.amount) ?? 0), 0);
    await base44.entities.Grant.update(parentId, { total_amount: sum });
  }, [parentType, parentId]);

  // The derived total is safe to retry (it recomputes from scratch), unlike the
  // row mutation — which is never retried. One immediate retry, no backoff.
  const syncFundingTotalWithRetry = useCallback(async () => {
    try {
      await syncFundingTotal();
      return true;
    } catch {
      try {
        await syncFundingTotal();
        return true;
      } catch {
        return false;
      }
    }
  }, [syncFundingTotal]);

  /**
   * Single seam — replace this function body with one transactional
   * server-side call once the Azure backend exists.
   *
   * Serializes funding ops so a recompute/write pair can never interleave with
   * another op and overwrite the total with a stale sum.
   */
  const runFundingOp = useCallback((rowMutation) => {
    // Counted synchronously at call time — before the op reaches the front of
    // the queue — so the controls disable immediately and stay disabled.
    pendingFundingOps.current += 1;
    setIsFundingSaving(true);

    const p = fundingQueue.current.then(async () => {
      try {
        await rowMutation();
        // Row is committed; a failed total sync must never undo it.
        const synced = await syncFundingTotalWithRetry();
        if (!synced) {
          toast({
            title: 'Sync failed',
            description: 'Funding saved, but Total Awarded could not be synchronised.',
            variant: 'destructive',
          });
        }
        invalidateFinancials();
        invalidateGrant();
      } finally {
        pendingFundingOps.current -= 1;
        if (pendingFundingOps.current === 0) setIsFundingSaving(false);
      }
    });
    // Keep the chain alive after a rejection so a later edit isn't stalled,
    // while still bubbling the real rejection to the caller.
    fundingQueue.current = p.catch(() => {});
    return p;
  }, [toast, syncFundingTotalWithRetry, invalidateFinancials, invalidateGrant]);

  const addFundingRow = useCallback((type, extra = {}) => runFundingOp(() => base44.entities.FinancialEntry.create({
    parent_type: parentType,
    parent_id: parentId,
    type: 'funding',
    sort_order: entries.filter(e => e.type === 'funding').length,
    amount: 0,
    amount_secondary: 0,
    status: 'scheduled',
    ...extra,
  })), [runFundingOp, parentType, parentId, entries]);

  const updateFundingRow = useCallback(
    (id, patch) => runFundingOp(() => base44.entities.FinancialEntry.update(id, patch)),
    [runFundingOp]
  );

  const deleteFundingRow = useCallback(
    (id) => runFundingOp(async () => {
      await base44.entities.FinancialEntry.delete(id);
      await base44.entities.NotePage.deleteMany({ object_type: 'grant_funding_entry', object_id: id });
    }),
    [runFundingOp]
  );

  return {
    entries,
    isLoading,
    failure: read,
    addFundingRow,
    updateFundingRow,
    deleteFundingRow,
    isFundingSaving,
  };
}