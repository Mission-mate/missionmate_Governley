import React, { useState } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { Loader2, Wrench } from 'lucide-react';
import { base44 } from '@/api/base44Client';
import { Button } from '@/components/ui/button';
import { toast } from '@/components/ui/use-toast';
import { invalidateBoardComposition } from '@/lib/boardCategories';

/**
 * Admin tidy-up: removes child records left pointing at a skill, category,
 * option or person that no longer exists. Safe to run any number of times.
 */
export default function ReconcileOrphansButton() {
  const qc = useQueryClient();
  const [busy, setBusy] = useState(false);

  const run = async () => {
    setBusy(true);
    try {
      const res = await base44.functions.invoke('reconcileBoardMatrixOrphans', {});
      const total = res?.data?.total ?? 0;
      const c = res?.data?.cleaned || {};
      invalidateBoardComposition(qc);
      ['boardPeople', 'committeeMembers', 'meetingParticipants'].forEach((k) => qc.invalidateQueries({ queryKey: [k] }));
      toast({
        title: total === 0 ? 'Nothing to clean up' : `Cleaned up ${total} leftover record${total === 1 ? '' : 's'}`,
        description: total === 0
          ? 'Every skill, attribute and membership record is correctly linked.'
          : `Skills ${c.memberSkills || 0}, attributes ${c.memberAttributes || 0}, committee memberships ${c.committeeMembers || 0}, meeting participation ${c.meetingParticipants || 0}.`,
      });
    } catch (err) {
      toast({ title: 'Could not run the clean-up', description: err?.message || 'Please try again.', variant: 'destructive' });
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="rounded-xl border border-border bg-muted/40 p-3 flex items-center justify-between gap-3">
      <div className="min-w-0">
        <p className="text-xs font-semibold text-foreground">Clean up leftover records</p>
        <p className="text-xs text-muted-foreground mt-0.5">Removes assignments still pointing at deleted skills, options or people.</p>
      </div>
      <Button variant="outline" size="sm" onClick={run} disabled={busy} className="shrink-0">
        {busy ? <Loader2 className="w-4 h-4 animate-spin" /> : <Wrench className="w-4 h-4" />}
        Run
      </Button>
    </div>
  );
}