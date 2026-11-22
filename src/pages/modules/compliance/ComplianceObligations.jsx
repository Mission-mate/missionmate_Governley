import React, { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { Plus, CalendarCheck, LibraryBig, ExternalLink, Pencil, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { ELEVATED_ROW, LIFT_BUTTON } from '@/components/shared/cardStyles';
import CapsuleTabs from '@/components/board/CapsuleTabs';
import ConfirmTypeDialog from '@/components/board/documents/ConfirmTypeDialog';
import CreateComplianceRegisterModal from '@/components/compliance/CreateComplianceRegisterModal';
import ComplianceCalendarIcon from '@/components/compliance/ComplianceCalendarIcon';
import ComplianceLibraryPane from '@/components/compliance/templates/ComplianceLibraryPane';
import LoaderOne from '@/components/ui/loaders/LoaderOne';
import LoadError from '@/components/shared/states/LoadError';
import {
  listComplianceRegisters, deleteComplianceCalendars,
  createComplianceRegister, updateComplianceRegister,
} from '@/lib/complianceApi';
import useCascadeDelete from '@/hooks/useCascadeDelete';
import { cloneComplianceRegister } from '@/lib/complianceClone';
import { toast } from '@/components/ui/use-toast';
import { formatPeriod, startYearFromDate } from '@/lib/financialYear';

const TABS = [
  { value: 'active', label: 'Active' },
  { value: 'archived', label: 'Archived' },
];

export default function ComplianceObligations() {
  const qc = useQueryClient();
  const navigate = useNavigate();
  const [tab, setTab] = useState('active');
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [showCreate, setShowCreate] = useState(false);
  const [editTarget, setEditTarget] = useState(null);
  const [libraryOpen, setLibraryOpen] = useState(false);

  const { data: registers = [], isLoading, ...read } = useQuery({
    queryKey: ['complianceRegisters'],
    queryFn: listComplianceRegisters,
  });

  const invalidate = () => {
    qc.invalidateQueries({ queryKey: ['complianceRegisters'] });
  };

  const filtered = registers.filter((r) => (r.status || 'active') === tab);

  const handleCreate = async ({ mode, cloneFromId, ...form }) => {
    const reg = await createComplianceRegister(form);
    if (mode === 'clone' && cloneFromId) {
      try {
        const { obligations, tasks } = await cloneComplianceRegister(cloneFromId, reg);
        toast({ title: 'Compliance calendar cloned', description: `${obligations} obligations and ${tasks} tasks copied.` });
      } catch (err) {
        toast({
          variant: 'destructive',
          title: 'Clone incomplete',
          description: `"${reg.title}" was created but some items could not be copied. Review it, or delete it and try again.`,
        });
      }
    }
    invalidate();
    setShowCreate(false);
    navigate(`/compliance/obligations/${reg.id}`);
  };

  // Only the register record is updated — existing obligation due dates stay exactly as saved.
  const handleEdit = async ({ mode, cloneFromId, ...form }) => {
    await updateComplianceRegister(editTarget.id, form);
    invalidate();
    setEditTarget(null);
  };

  const del = useCascadeDelete(deleteComplianceCalendars, 'calendar');

  const handleDelete = async () => {
    const failed = await del.confirm([deleteTarget.id]);
    invalidate();
    if (!failed.length) setDeleteTarget(null);
  };

  return (
    <div className="p-6 lg:p-8 max-w-5xl mx-auto">
      <div className="flex items-start justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Compliance Calendar</h1>
          <p className="text-sm text-muted-foreground mt-1">Create and manage annual compliance calendars to track your organisation's obligations.</p>
        </div>
        <Button onClick={() => setShowCreate(true)}>
          <Plus className="w-4 h-4" /> Compliance Calendar
        </Button>
      </div>

      <div className="flex items-center justify-between mb-6">
        <CapsuleTabs animated tabs={TABS.map((t) => ({ ...t, count: registers.filter((r) => (r.status || 'active') === t.value).length }))} value={tab} onChange={setTab} />
        <Button variant="outline" onClick={() => setLibraryOpen(true)}>
          <LibraryBig className="w-4 h-4" /> Compliance Library
        </Button>
      </div>

      {isLoading ? (
        <div className="flex justify-center py-16"><LoaderOne size="lg" /></div>
      ) : read.isLoadingError ? (
        <LoadError failure={read} title="Couldn’t load compliance calendars" />
      ) : filtered.length === 0 ? (
        <div className="bg-card border border-border rounded-xl py-16 px-6 text-center">
          <CalendarCheck className="w-9 h-9 mx-auto mb-3 text-muted-foreground/50" />
          <h3 className="text-base font-semibold text-foreground">No compliance calendars</h3>
          <p className="text-sm text-muted-foreground mt-1 mb-4">Create a Compliance Calendar to start tracking obligations.</p>
          <Button variant="outline" onClick={() => setShowCreate(true)}>Create Compliance Calendar</Button>
        </div>
      ) : (
        <div className="content-enter space-y-3">
          {filtered.map((reg) => (
              <div key={reg.id} className={`${ELEVATED_ROW} p-4 flex items-center justify-between`}>
                <div className="flex items-center gap-4">
                  <ComplianceCalendarIcon size={56} className="shrink-0 rounded-[12px] ring-1 ring-black/5 dark:ring-white/10 shadow-[0_2px_6px_rgba(0,0,0,0.10),0_10px_24px_rgba(0,0,0,0.08)]" />
                  <div>
                    <h3 className="text-sm font-semibold text-foreground">{reg.title}</h3>
                    <p className="text-xs text-muted-foreground mt-0.5">{reg.description || 'No description provided'}</p>
                    {reg.financial_year_start && (
                      <p className="text-xs text-muted-foreground mt-1">
                        <span className="font-medium text-foreground">Compliance Period</span> {formatPeriod(reg.compliance_period_type, startYearFromDate(reg.financial_year_start))}
                      </p>
                    )}
                  </div>
                </div>
                <div className="flex items-center gap-1.5">
                  <Button variant="outline" size="sm" onClick={() => navigate(`/compliance/obligations/${reg.id}`)} className={`${LIFT_BUTTON} h-8 px-3 text-xs font-medium`}>
                    <ExternalLink className="w-4 h-4" /> Open
                  </Button>
                  <Button variant="outline" size="sm" onClick={() => setEditTarget(reg)} className={`${LIFT_BUTTON} h-8 px-3 text-xs font-medium`}>
                    <Pencil className="w-4 h-4" /> Edit
                  </Button>
                  <Button variant="outline" size="sm" onClick={() => setDeleteTarget(reg)} className={`${LIFT_BUTTON} h-8 px-3 text-xs font-medium text-muted-foreground hover:text-destructive hover:border-destructive/30 hover:bg-destructive/5`}>
                    <Trash2 className="w-4 h-4" /> Delete
                  </Button>
                </div>
              </div>
          ))}
        </div>
      )}

      <CreateComplianceRegisterModal
        isOpen={showCreate}
        registers={registers}
        onClose={() => setShowCreate(false)}
        onSubmit={handleCreate}
      />

      <CreateComplianceRegisterModal
        isOpen={!!editTarget}
        register={editTarget}
        onClose={() => setEditTarget(null)}
        onSubmit={handleEdit}
      />

      <ConfirmTypeDialog
        isOpen={!!deleteTarget}
        title="Delete Compliance Calendar"
        message={`Permanently delete "${deleteTarget?.title}"? All of its obligations and their checklist items, notes, documents and folders will be deleted too. This cannot be undone.`}
        keyword="DELETE"
        confirmLabel="Delete"
        error={del.error}
        onConfirm={handleDelete}
        onClose={() => { setDeleteTarget(null); del.clearError(); }}
      />

      <ComplianceLibraryPane isOpen={libraryOpen} onClose={() => setLibraryOpen(false)} />
    </div>
  );
}