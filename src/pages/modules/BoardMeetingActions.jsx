import React, { useState } from 'react';
import RegisterCard from '@/components/board/registers/RegisterCard';
import { useNavigate } from 'react-router-dom';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { Plus, ClipboardList } from 'lucide-react';
import { Button } from '@/components/ui/button';
import CapsuleTabs from '@/components/board/CapsuleTabs';
import ConfirmTypeDialog from '@/components/board/documents/ConfirmTypeDialog';
import CreateActionRegisterModal from '@/components/board/meeting-actions/CreateActionRegisterModal';
import ActionRegisterIcon from '@/components/board/meeting-actions/ActionRegisterIcon';
import ModuleLoader from '@/components/shared/states/ModuleLoader';
import LoadError from '@/components/shared/states/LoadError';
import {
  listMeetingActionRegisters, deleteMeetingActionRegister,
  createMeetingActionRegister, updateMeetingActionRegister,
} from '@/lib/meetingActionApi';
import { runDelete } from '@/lib/deleteWithFeedback';

const OBJECT_TYPE = 'board';
const OBJECT_ID = 'board';

const TABS = [
  { value: 'active',   label: 'Active'   },
  { value: 'archived', label: 'Archived' },
];

export default function BoardMeetingActions() {
  const qc = useQueryClient();
  const navigate = useNavigate();
  const [tab, setTab] = useState('active');
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [showCreate, setShowCreate] = useState(false);
  const [editTarget, setEditTarget] = useState(null);

  const { data: realRegisters = [], isLoading, ...read } = useQuery({
    queryKey: ['meetingActionRegisters', OBJECT_TYPE, OBJECT_ID],
    queryFn: () => listMeetingActionRegisters(OBJECT_TYPE, OBJECT_ID),
  });
  const registers = realRegisters;

  const filtered = registers.filter(r => (r.status || 'active') === tab);

  const invalidate = () => {
    qc.invalidateQueries({ queryKey: ['meetingActionRegisters', OBJECT_TYPE, OBJECT_ID] });
  };

  const handleCreate = async ({ title, description, status }) => {
    const reg = await createMeetingActionRegister({ title, description, status, objectType: OBJECT_TYPE, objectId: OBJECT_ID });
    invalidate();
    setShowCreate(false);
    navigate(`/board/meeting-actions/${reg.id}`);
  };

  const handleEdit = async ({ title, description, status }) => {
    await updateMeetingActionRegister(editTarget.id, { title, description, status });
    invalidate();
    qc.invalidateQueries({ queryKey: ['meetingActionRegisterLinks'] });
    setEditTarget(null);
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    const ok = await runDelete(() => deleteMeetingActionRegister(deleteTarget.id), {
      errorTitle: 'Could not delete register',
    });
    invalidate();
    if (ok) setDeleteTarget(null);
  };

  return (
    <div className="p-6 lg:p-8 max-w-5xl mx-auto">
      <div className="flex items-start justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Action Registers</h1>
          <p className="text-sm text-muted-foreground mt-1">Track meeting actions, owners, due dates and progress</p>
        </div>
        <Button onClick={() => setShowCreate(true)}>
          <Plus className="w-4 h-4" /> New Action Register
        </Button>
      </div>

      <CapsuleTabs animated tabs={TABS.map((t) => ({ ...t, count: registers.filter((r) => (r.status || 'active') === t.value).length }))} value={tab} onChange={setTab} className="mb-6" />

      {isLoading ? (
        <ModuleLoader />
      ) : read.isLoadingError ? (
        <LoadError failure={read} title="Couldn’t load action registers" />
      ) : filtered.length === 0 ? (
        <div className="bg-card border border-border rounded-xl py-16 px-6 text-center">
          <ClipboardList className="w-9 h-9 mx-auto mb-3 text-muted-foreground/50" />
          <h3 className="text-base font-semibold text-foreground">No registers</h3>
          <p className="text-sm text-muted-foreground mt-1 mb-4">Create a Meeting Action Register to start tracking actions.</p>
          <Button variant="outline" onClick={() => setShowCreate(true)}>Create Register</Button>
        </div>
      ) : (
        <div className="content-enter space-y-3">
          {filtered.map(reg => (
            <RegisterCard
              key={reg.id}
              icon={ActionRegisterIcon}
              register={reg}
              onOpen={() => navigate(`/board/meeting-actions/${reg.id}`)}
              onEdit={() => setEditTarget(reg)}
              onDelete={() => setDeleteTarget(reg)}
            />
          ))}
        </div>
      )}

      <CreateActionRegisterModal
        isOpen={showCreate}
        onClose={() => setShowCreate(false)}
        onSubmit={handleCreate}
      />

      <CreateActionRegisterModal
        isOpen={!!editTarget}
        register={editTarget}
        onClose={() => setEditTarget(null)}
        onSubmit={handleEdit}
      />

      <ConfirmTypeDialog
        isOpen={!!deleteTarget}
        title="Delete Register"
        message={`Permanently delete "${deleteTarget?.title}"? All actions and notes will be removed.`}
        keyword="DELETE"
        confirmLabel="Delete"
        onConfirm={handleDelete}
        onClose={() => setDeleteTarget(null)}
      />
    </div>
  );
}