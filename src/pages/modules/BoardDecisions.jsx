import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { Plus, Gavel } from 'lucide-react';
import { Button } from '@/components/ui/button';
import CapsuleTabs from '@/components/board/CapsuleTabs';
import ConfirmTypeDialog from '@/components/board/documents/ConfirmTypeDialog';
import CreateActionRegisterModal from '@/components/board/meeting-actions/CreateActionRegisterModal';
import DecisionRegisterIcon from '@/components/board/decisions/DecisionRegisterIcon';
import RegisterCard from '@/components/board/registers/RegisterCard';
import ModuleLoader from '@/components/shared/states/ModuleLoader';
import LoadError from '@/components/shared/states/LoadError';
import {
  listDecisionRegisters, createDecisionRegister,
  updateDecisionRegister, deleteDecisionRegister,
} from '@/lib/decisionRegisterApi';
import { runDelete } from '@/lib/deleteWithFeedback';

const QUERY_KEY = ['decisionRegisters'];

const TABS = [
  { value: 'active', label: 'Active' },
  { value: 'archived', label: 'Archived' },
];

const MODAL_COPY = {
  noun: 'Decisions Register',
  titlePlaceholder: 'e.g. 2025-26 Board Decisions Register',
  descriptionPlaceholder: 'e.g. Records all key decisions made at Board and Committee meetings',
};

export default function BoardDecisions() {
  const qc = useQueryClient();
  const navigate = useNavigate();
  const [tab, setTab] = useState('active');
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [showCreate, setShowCreate] = useState(false);
  const [editTarget, setEditTarget] = useState(null);

  const { data: registers = [], isLoading, ...read } = useQuery({
    queryKey: QUERY_KEY,
    queryFn: listDecisionRegisters,
  });

  const filtered = registers.filter((r) => (r.status || 'active') === tab);
  const invalidate = () => qc.invalidateQueries({ queryKey: QUERY_KEY });

  const handleCreate = async (values) => {
    const reg = await createDecisionRegister(values);
    invalidate();
    setShowCreate(false);
    navigate(`/board/decisions/${reg.id}`);
  };

  const handleEdit = async (values) => {
    await updateDecisionRegister(editTarget.id, values);
    invalidate();
    qc.invalidateQueries({ queryKey: ['decisionRegister', editTarget.id] });
    setEditTarget(null);
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    const ok = await runDelete(() => deleteDecisionRegister(deleteTarget.id), {
      errorTitle: 'Could not delete register',
    });
    invalidate();
    if (ok) setDeleteTarget(null);
  };

  return (
    <div className="p-6 lg:p-8 max-w-5xl mx-auto">
      <div className="flex items-start justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Decisions Registers</h1>
          <p className="text-sm text-muted-foreground mt-1">A central record of key decisions and resolutions from meetings.</p>
        </div>
        <Button onClick={() => setShowCreate(true)}>
          <Plus className="w-4 h-4" /> New Decisions Register
        </Button>
      </div>

      <CapsuleTabs animated tabs={TABS.map((t) => ({ ...t, count: registers.filter((r) => (r.status || 'active') === t.value).length }))} value={tab} onChange={setTab} className="mb-6" />

      {isLoading ? (
        <ModuleLoader />
      ) : read.isLoadingError ? (
        <LoadError failure={read} title="Couldn’t load decisions registers" />
      ) : filtered.length === 0 ? (
        <div className="bg-card border border-border rounded-xl py-16 px-6 text-center">
          <Gavel className="w-9 h-9 mx-auto mb-3 text-muted-foreground/50" />
          <h3 className="text-base font-semibold text-foreground">No registers</h3>
          <p className="text-sm text-muted-foreground mt-1 mb-4">Create a Decisions Register to start recording key decisions.</p>
          <Button variant="outline" onClick={() => setShowCreate(true)}>Create Register</Button>
        </div>
      ) : (
        <div className="content-enter space-y-3">
          {filtered.map((reg) => (
            <RegisterCard
              key={reg.id}
              icon={DecisionRegisterIcon}
              register={reg}
              onOpen={() => navigate(`/board/decisions/${reg.id}`)}
              onEdit={() => setEditTarget(reg)}
              onDelete={() => setDeleteTarget(reg)}
            />
          ))}
        </div>
      )}

      <CreateActionRegisterModal
        {...MODAL_COPY}
        isOpen={showCreate}
        onClose={() => setShowCreate(false)}
        onSubmit={handleCreate}
      />

      <CreateActionRegisterModal
        {...MODAL_COPY}
        isOpen={!!editTarget}
        register={editTarget}
        onClose={() => setEditTarget(null)}
        onSubmit={handleEdit}
      />

      <ConfirmTypeDialog
        isOpen={!!deleteTarget}
        title="Delete Register"
        message={`Permanently delete "${deleteTarget?.title}"? This cannot be recovered.`}
        keyword="DELETE"
        confirmLabel="Delete"
        onConfirm={handleDelete}
        onClose={() => setDeleteTarget(null)}
      />
    </div>
  );
}