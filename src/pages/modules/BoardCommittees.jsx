import React, { useState, useMemo } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Plus, Users } from 'lucide-react';
import { Button } from '@/components/ui/button';
import CapsuleTabs from '@/components/board/CapsuleTabs';
import CommitteeCard from '@/components/board/committees/CommitteeCard';
import CreateCommitteePane from '@/components/board/committees/CreateCommitteePane';
import EditCommitteePane from '@/components/board/committees/EditCommitteePane';
import DeleteCommitteeDialog from '@/components/board/committees/DeleteCommitteeDialog';
import DeleteCommitteeBlockedDialog from '@/components/board/committees/DeleteCommitteeBlockedDialog';
import CommitteeActionBar from '@/components/board/committees/CommitteeActionBar';
import { archiveCommittee, restoreCommittee, getCommitteeDeleteBlockers } from '@/lib/committeesApi';
import ModuleLoader from '@/components/shared/states/ModuleLoader';
import LoadError from '@/components/shared/states/LoadError';
import { loadFailure } from '@/lib/readState';
import ErrorBoundary from '@/components/shared/states/ErrorBoundary';
import { toast } from '@/components/ui/use-toast';

export default function BoardCommittees() {
  const qc = useQueryClient();
  const [tab, setTab] = useState('active');
  const [modalOpen, setModalOpen] = useState(false);
  const [selected, setSelected] = useState(null);
  const [viewTarget, setViewTarget] = useState(null);
  const [editTarget, setEditTarget] = useState(null);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [blocked, setBlocked] = useState(null);

  const { data: committees = [], isLoading, ...committeesRead } = useQuery({
    queryKey: ['committees'],
    queryFn: () => base44.entities.Committee.list('-created_date')
  });
  const { data: members = [], ...membersRead } = useQuery({
    queryKey: ['committeeMembers', 'all'],
    queryFn: () => base44.entities.CommitteeMember.list()
  });
  const failure = loadFailure(committeesRead, membersRead);

  const counts = useMemo(() => {
    const c = {};
    members.forEach((m) => {c[m.committee_id] = (c[m.committee_id] || 0) + 1;});
    return c;
  }, [members]);

  const activeList = useMemo(() => committees.filter((c) => c.status !== 'archived'), [committees]);
  const archivedList = useMemo(() => committees.filter((c) => c.status === 'archived'), [committees]);
  const visible = tab === 'archived' ? archivedList : activeList;

  const clearSelection = () => setSelected(null);

  // Single-select only — picking a card replaces any previous selection.
  const toggleSelect = (committee) =>
    setSelected((prev) => (prev?.id === committee.id ? null : committee));

  const refresh = () => {
    qc.invalidateQueries({ queryKey: ['committees'] });
    clearSelection();
  };

  const archive = useMutation({
    mutationFn: (id) => archiveCommittee(id),
    onSuccess: () => { refresh(); setTab('archived'); },
    onError: (err) => toast({ variant: 'destructive', title: 'Could not archive committee', description: err?.message })
  });

  const restore = useMutation({
    mutationFn: (id) => restoreCommittee(id),
    onSuccess: () => { refresh(); setTab('active'); },
    onError: (err) => toast({ variant: 'destructive', title: 'Could not restore committee', description: err?.message })
  });

  // Pre-check before opening the type-DELETE modal: members must be removed and
  // meetings reassigned, otherwise the blocked state is shown instead.
  const checkDelete = useMutation({
    mutationFn: (committee) => getCommitteeDeleteBlockers(committee.id),
    onSuccess: (blockers, committee) => {
      if (blockers.memberCount > 0 || blockers.meetingCount > 0) {
        setBlocked({ committee, blockers });
      } else {
        setDeleteTarget(committee);
      }
    },
    onError: (err) => toast({ variant: 'destructive', title: 'Could not check committee', description: err?.message })
  });

  return (
    <div className="p-6 lg:p-8 max-w-5xl mx-auto">
      <div className="flex items-start justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Committees</h1>
          <p className="text-sm text-muted-foreground mt-1">Manage meeting committees and committee members</p>
        </div>
        <Button onClick={() => setModalOpen(true)}>
          <Plus className="w-4 h-4" /> Create New Committee
        </Button>
      </div>

      <div className="mb-5">
        <CapsuleTabs
          animated
          tabs={[
            { value: 'active', label: 'Active', count: activeList.length },
            { value: 'archived', label: 'Archived', count: archivedList.length }
          ]}
          value={tab}
          onChange={(v) => { setTab(v); clearSelection(); }} />
      </div>

      {isLoading ?
      <ModuleLoader /> :
      failure.isLoadingError ?
      <LoadError failure={failure} title="Couldn’t load committees" /> :
      visible.length === 0 ?
      <div className="text-center py-16 text-muted-foreground">
          <Users className="w-10 h-10 mx-auto mb-3 opacity-40" />
          <p className="text-sm">{tab === 'archived' ? 'No archived committees.' : 'No committees yet.'}</p>
        </div> :

      <div className="content-enter grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {visible.map((c) =>
        <ErrorBoundary key={c.id} resetKey={c.id}>
            <CommitteeCard
            committee={c}
            memberCount={counts[c.id] || 0}
            selected={selected?.id === c.id}
            onToggleSelect={toggleSelect}
            onView={setViewTarget} />
          </ErrorBoundary>
        )}
        </div>
      }

      <CommitteeActionBar
        committee={selected}
        onView={() => setViewTarget(selected)}
        onEdit={() => setEditTarget(selected)}
        onArchive={() => archive.mutate(selected.id)}
        onRestore={() => restore.mutate(selected.id)}
        onDelete={() => checkDelete.mutate(selected)}
        onClear={clearSelection} />

      <CreateCommitteePane isOpen={modalOpen} onClose={() => setModalOpen(false)} />
      <EditCommitteePane committee={viewTarget} isOpen={!!viewTarget} viewFirst onClose={() => setViewTarget(null)} />
      <EditCommitteePane
        committee={editTarget}
        isOpen={!!editTarget}
        onClose={() => { setEditTarget(null); clearSelection(); }} />
      <DeleteCommitteeDialog
        committee={deleteTarget}
        isOpen={!!deleteTarget}
        onClose={() => { setDeleteTarget(null); clearSelection(); }} />
      <DeleteCommitteeBlockedDialog
        committee={blocked?.committee}
        blockers={blocked?.blockers}
        isOpen={!!blocked}
        onClose={() => setBlocked(null)}
        onResolved={() => {
          const committee = blocked.committee;
          setBlocked(null);
          checkDelete.mutate(committee);
        }} />
    </div>);

}