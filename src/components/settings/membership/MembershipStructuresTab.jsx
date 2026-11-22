import React, { useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { Plus, Pencil, Trash2 } from 'lucide-react';
import { base44 } from '@/api/base44Client';
import { Button } from '@/components/ui/button';
import { LoaderOne } from '@/components/ui/loaders';
import LoadError from '@/components/shared/states/LoadError';
import { useToast } from '@/components/ui/use-toast';
import DeletePlanDialog from '@/components/settings/membership/DeletePlanDialog';
import MembershipPlanEditorPane from '@/components/settings/membership/MembershipPlanEditorPane';
import { renewalPeriodLabel } from '@/lib/membershipStructures';

const renewalLabel = renewalPeriodLabel;

const renewalCalcLabel = (s) => s.renewal_calculation || '–';

const feeLabel = (s) => {
  const t = s.fee_type;
  if (!t || t === 'Free' || t === 'No Membership Fee') return 'Free';
  if (t === 'Fixed' || t === 'Custom') return s.fee_amount ? `$${Number(s.fee_amount).toFixed(2)}` : 'Free';
  if (t === 'Tiered') return 'Tiered';
  return t;
};

export default function MembershipStructuresTab() {
  const qc = useQueryClient();
  const { toast } = useToast();
  const [deleting, setDeleting] = useState(null);
  const [editingPlanId, setEditingPlanId] = useState(null);

  const { data: structures = [], isLoading, ...read } = useQuery({
    queryKey: ['membership_structures'],
    queryFn: () => base44.entities.MembershipStructure.list('-created_date'),
  });

  // Members still on the plan being deleted — the delete is blocked while any exist.
  const { data: affectedMembers, isFetching: checkingMembers } = useQuery({
    queryKey: ['members_on_structure', deleting?.id],
    queryFn: () => base44.entities.Member.filter({ membership_structure_id: deleting.id }),
    enabled: !!deleting?.id,
  });

  const refresh = () => qc.invalidateQueries({ queryKey: ['membership_structures'] });

  const openPlan = (id) => setEditingPlanId(id);

  const handleDelete = async () => {
    if ((affectedMembers?.length || 0) > 0) return;
    const deletedId = deleting.id;
    await base44.entities.MembershipStructure.delete(deletedId);
    setDeleting(null);
    toast({ title: 'Membership plan deleted' });
    refresh();
    // Strip the deleted plan out of the membership form config so no dangling
    // chips or silently-dead visibility rules are left behind. Submissions keep
    // their cached plan name as a historical snapshot and are not touched.
    try {
      await base44.functions.invoke('cleanupDeletedPlanReferences', { structureId: deletedId });
      qc.invalidateQueries({ queryKey: ['membership_form_config'] });
    } catch {
      toast({
        title: 'Plan deleted, form not updated',
        description: 'The membership form still references this plan. Remove it from the Membership Page settings.',
        variant: 'destructive',
      });
    }
  };

  return (
    <div>
      <div className="flex items-start justify-between mb-5">
        <div>
          <h3 className="text-base font-bold text-foreground">Membership Plans</h3>
          <p className="text-sm text-muted-foreground">Configure the membership plans used in the Membership module.</p>
        </div>
        <Button onClick={() => openPlan('new')} className="gap-1.5">
          <Plus className="w-4 h-4" /> Add Membership Plan
        </Button>
      </div>

      <div className="border border-border rounded-xl overflow-hidden">
        <div className="flex items-center px-4 py-2.5 gap-3 bg-secondary/40 border-b border-border">
          <span className="flex-1 text-xs font-semibold text-foreground/80 uppercase tracking-wide">Plan</span>
          <span className="w-32 text-xs font-semibold text-foreground/80 uppercase tracking-wide">Fee Type</span>
          <span className="w-48 text-xs font-semibold text-foreground/80 uppercase tracking-wide">Renewal Period</span>
          <span className="w-48 text-xs font-semibold text-foreground/80 uppercase tracking-wide">Renewal Calculation</span>
          <span className="w-24 text-xs font-semibold text-foreground/80 uppercase tracking-wide text-right">Actions</span>
        </div>

        {isLoading ? (
          <div className="py-10 flex justify-center">
            <LoaderOne />
          </div>
        ) : read.isLoadingError ? (
          <LoadError failure={read} title="Couldn’t load membership plans" className="shadow-none dark:ring-0" />
        ) : structures.length === 0 ? (
          <div className="px-4 py-8 text-center text-sm text-muted-foreground">
            No membership plans yet. Click "Add Membership Plan" to create one.
          </div>
        ) : (
          structures.map((s, idx) => (
            <div
              key={s.id}
              onClick={() => openPlan(s.id)}
              className={`flex items-center px-4 py-3.5 gap-3 bg-background cursor-pointer hover:bg-muted/30 transition-colors ${idx < structures.length - 1 ? 'border-b border-border' : ''}`}
            >
              <span className="flex-1 text-sm font-semibold text-foreground">{s.name}</span>
              <span className="w-32 text-sm text-foreground">{feeLabel(s)}</span>
              <span className="w-48 text-sm text-foreground">{renewalLabel(s)}</span>
              <span className="w-48 text-sm text-foreground">{renewalCalcLabel(s)}</span>
              <div className="w-24 flex items-center justify-end gap-2.5" onClick={(e) => e.stopPropagation()}>
                <button onClick={() => openPlan(s.id)} title="Edit" className="text-muted-foreground hover:text-foreground transition-colors">
                  <Pencil className="w-4 h-4" />
                </button>
                <button onClick={() => setDeleting(s)} title="Delete" className="text-red-400 hover:text-red-600 transition-colors">
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>
          ))
        )}
      </div>

      <DeletePlanDialog
        isOpen={!!deleting}
        plan={deleting}
        memberCount={affectedMembers?.length || 0}
        checkingMembers={checkingMembers}
        onClose={() => setDeleting(null)}
        onConfirm={handleDelete}
      />

      <MembershipPlanEditorPane
        isOpen={!!editingPlanId}
        planId={editingPlanId}
        onClose={() => setEditingPlanId(null)}
        onSaved={() => { setEditingPlanId(null); refresh(); }}
      />
    </div>
  );
}