import React, { useState } from 'react';
import { ELEVATED_ROW, LIFT_BUTTON } from '@/components/shared/cardStyles';
import { useNavigate } from 'react-router-dom';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { Plus, ListChecks, LibraryBig, ExternalLink, Pencil, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import CapsuleTabs from '@/components/board/CapsuleTabs';
import ConfirmTypeDialog from '@/components/board/documents/ConfirmTypeDialog';
import CreateWorkPlanModal from '@/components/board/workplan/CreateWorkPlanModal';
import WorkPlanIcon from '@/components/board/workplan/WorkPlanIcon';
import WorkPlanLibraryPane from '@/components/board/workplan/WorkPlanLibraryPane';
import LoaderOne from '@/components/ui/loaders/LoaderOne';
import LoadError from '@/components/shared/states/LoadError';
import {
  listWorkPlans, deleteWorkPlan, createWorkPlan, updateWorkPlan,
} from '@/lib/workPlanApi';
import { cloneWorkPlanItems } from '@/lib/workPlanClone';
import { formatPeriod, startYearFromDate } from '@/lib/financialYear';
import { runDelete } from '@/lib/deleteWithFeedback';

const TABS = [
  { value: 'active', label: 'Active' },
  { value: 'archived', label: 'Archived' },
];

export default function WorkPlans() {
  const qc = useQueryClient();
  const navigate = useNavigate();
  const [tab, setTab] = useState('active');
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [showCreate, setShowCreate] = useState(false);
  const [editTarget, setEditTarget] = useState(null);
  const [libraryOpen, setLibraryOpen] = useState(false);

  const { data: plans = [], isLoading, ...read } = useQuery({
    queryKey: ['workPlans'],
    queryFn: listWorkPlans,
  });

  const filtered = plans.filter((p) => (p.status || 'active') === tab);

  const invalidate = () => {
    qc.invalidateQueries({ queryKey: ['workPlans'] });
  };

  const handleCreate = async ({ cloneFromId, ...form }) => {
    const plan = await createWorkPlan(form);
    if (cloneFromId) await cloneWorkPlanItems(cloneFromId, plan);
    invalidate();
    setShowCreate(false);
    navigate(`/board/work-plans/${plan.id}`);
  };

  // Only the work plan record is updated — existing work item target months stay as saved.
  const handleEdit = async ({ cloneFromId, ...form }) => {
    await updateWorkPlan(editTarget.id, form);
    invalidate();
    setEditTarget(null);
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    const ok = await runDelete(() => deleteWorkPlan(deleteTarget.id), {
      errorTitle: 'Could not delete work plan',
    });
    invalidate();
    if (ok) setDeleteTarget(null);
  };

  return (
    <div className="p-6 lg:p-8 max-w-5xl mx-auto">
      <div className="flex items-start justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Annual Work Plan</h1>
          <p className="text-sm text-muted-foreground mt-1">Manage your annual board governance work plan at a glance.</p>
        </div>
        <Button onClick={() => setShowCreate(true)}>
          <Plus className="w-4 h-4" /> Create Work Plan
        </Button>
      </div>

      <div className="flex items-center justify-between mb-6">
        <CapsuleTabs animated tabs={TABS.map((t) => ({ ...t, count: plans.filter((p) => (p.status || 'active') === t.value).length }))} value={tab} onChange={setTab} />
        <Button variant="outline" onClick={() => setLibraryOpen(true)}>
          <LibraryBig className="w-4 h-4" /> Work Plan Library
        </Button>
      </div>

      {isLoading ? (
        <div className="flex justify-center py-16"><LoaderOne size="lg" /></div>
      ) : read.isLoadingError ? (
        <LoadError failure={read} title="Couldn’t load work plans" />
      ) : filtered.length === 0 ? (
        <div className="bg-card border border-border rounded-xl py-16 px-6 text-center">
          <ListChecks className="w-9 h-9 mx-auto mb-3 text-muted-foreground/50" />
          <h3 className="text-base font-semibold text-foreground">No work plans</h3>
          <p className="text-sm text-muted-foreground mt-1 mb-4">Create a work plan to start tracking board work items.</p>
          <Button variant="outline" onClick={() => setShowCreate(true)}>Create Work Plan</Button>
        </div>
      ) : (
        <div className="content-enter space-y-3">
          {filtered.map((plan) => (
              <div key={plan.id} className={`${ELEVATED_ROW} p-4 flex items-center justify-between`}>
                <div className="flex items-center gap-4">
                  <WorkPlanIcon size={56} className="shrink-0 rounded-[12px] ring-1 ring-black/5 dark:ring-white/10 shadow-[0_2px_6px_rgba(0,0,0,0.10),0_10px_24px_rgba(0,0,0,0.08)]" />
                  <div>
                    <h3 className="text-sm font-semibold text-foreground">{plan.title}</h3>
                    <p className="text-xs text-muted-foreground mt-0.5">{plan.description || 'No description provided'}</p>
                    {plan.financial_year_start && (
                      <p className="text-xs text-muted-foreground mt-1">
                        <span className="font-medium text-foreground">Work Plan Period</span> {formatPeriod(plan.compliance_period_type, startYearFromDate(plan.financial_year_start))}
                      </p>
                    )}
                  </div>
                </div>
                <div className="flex items-center gap-1.5">
                  <Button variant="outline" size="sm" onClick={() => navigate(`/board/work-plans/${plan.id}`)} className={`${LIFT_BUTTON} h-8 px-3 text-xs font-medium`}>
                    <ExternalLink className="w-4 h-4" /> Open
                  </Button>
                  <Button variant="outline" size="sm" onClick={() => setEditTarget(plan)} className={`${LIFT_BUTTON} h-8 px-3 text-xs font-medium`}>
                    <Pencil className="w-4 h-4" /> Edit
                  </Button>
                  <Button variant="outline" size="sm" onClick={() => setDeleteTarget(plan)} className={`${LIFT_BUTTON} h-8 px-3 text-xs font-medium text-muted-foreground hover:text-destructive hover:border-destructive/30 hover:bg-destructive/5`}>
                    <Trash2 className="w-4 h-4" /> Delete
                  </Button>
                </div>
              </div>
          ))}
        </div>
      )}

      <CreateWorkPlanModal
        isOpen={showCreate}
        plans={plans}
        onClose={() => setShowCreate(false)}
        onSubmit={handleCreate}
      />

      <CreateWorkPlanModal
        isOpen={!!editTarget}
        workPlan={editTarget}
        onClose={() => setEditTarget(null)}
        onSubmit={handleEdit}
      />

      <ConfirmTypeDialog
        isOpen={!!deleteTarget}
        title="Delete Work Plan"
        message={`Permanently delete "${deleteTarget?.title}"? All work items inside it will be removed.`}
        keyword="DELETE"
        confirmLabel="Delete"
        onConfirm={handleDelete}
        onClose={() => setDeleteTarget(null)}
      />

      <WorkPlanLibraryPane isOpen={libraryOpen} onClose={() => setLibraryOpen(false)} />
    </div>
  );
}