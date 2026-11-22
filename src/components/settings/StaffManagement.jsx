import React, { useState, useMemo } from 'react';
import { Plus, Search } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { base44 } from '@/api/base44Client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import StaffTable from './staff/StaffTable';
import AddStaffModal from './staff/AddStaffModal';
import StaffMemberPane from './staff/StaffMemberPane';
import RemoveStaffModal from './staff/RemoveStaffModal';
import ModuleLoader from '@/components/shared/states/ModuleLoader';
import LoadError from '@/components/shared/states/LoadError';
import SingleRecordActionBar from '@/components/shared/SingleRecordActionBar';
import { useAuth } from '@/lib/AuthContext';

export default function StaffManagement() {
  const queryClient = useQueryClient();
  const [search, setSearch] = useState('');
  const [addOpen, setAddOpen] = useState(false);
  const { user } = useAuth();
  // { member, edit } — the pane opens in view mode unless edit is true.
  const [pane, setPane] = useState(null);
  const [removeMember, setRemoveMember] = useState(null);
  const [selectedId, setSelectedId] = useState(null);
  const openPane = (member, edit = false) => { setSelectedId(null); setPane({ member, edit }); };

  const { data: allUsers = [], isLoading, ...read } = useQuery({
    queryKey: ['users'],
    queryFn: () => base44.entities.User.list(),
  });

  // Exclude the System Collaborator (platform Owner) — their details are not
  // managed by the organisation, so they are hidden from Staff Management.
  const members = useMemo(
    () => allUsers.filter(m => m.role?.toLowerCase() !== 'owner'),
    [allUsers]
  );

  const filtered = useMemo(() => {
    const q = search.toLowerCase();
    if (!q) return members;
    return members.filter(m =>
      `${m.first_name} ${m.last_name}`.toLowerCase().includes(q) ||
      m.email?.toLowerCase().includes(q) ||
      m.role?.toLowerCase().includes(q)
    );
  }, [members, search]);

  const selectedMember = members.find((m) => m.id === selectedId) || null;

  const addMutation = useMutation({
    mutationFn: (data) => base44.users.inviteUser(data.email, data.role || 'user', { first_name: data.first_name, last_name: data.last_name }),
    onSuccess: () => {
      queryClient.invalidateQueries(['users']);
      toast.success('Team member invited');
    },
  });

  const updateMutation = useMutation({
    mutationFn: (data) => base44.entities.User.update(data.id, {
      first_name: data.first_name,
      last_name: data.last_name,
      role: data.role,
      status: data.status,
      access_control: data.access_control,
      permissions: data.permissions,
    }),
    onSuccess: () => {
      queryClient.invalidateQueries(['users']);
      toast.success('Team member updated');
    },
  });

  const removeMutation = useMutation({
    mutationFn: (member) => base44.entities.User.delete(member.id),
    onSuccess: () => {
      setSelectedId(null);
      queryClient.invalidateQueries(['users']);
      toast.success('Team member removed');
    },
    onError: () => {
      toast.error('Failed to remove team member');
    },
  });

  const handleSendInvite = async (member) => {
    try {
      await base44.users.inviteUser(member.email || member.invited_email, member.role || 'user');
      toast.success(`Invite sent to ${member.email || member.invited_email}`);
    } catch {
      toast.error('Failed to send invite');
    }
  };

  return (
    <div>
      {/* Header */}
      <div className="flex items-start justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold text-foreground mb-1">Team Management</h1>
          <p className="text-sm text-muted-foreground">Manage team members and their access levels.</p>
        </div>
        <Button className="gap-2" onClick={() => setAddOpen(true)}>
          <Plus className="w-4 h-4" /> Add Team Member
        </Button>
      </div>

      {/* Team Members Card */}
      <div className="border border-border rounded-xl bg-white dark:bg-card overflow-hidden">
        <div className="px-6 pt-6 pb-4 border-b border-border">
          <h2 className="text-lg font-bold text-foreground mb-0.5">Team Members</h2>
          <p className="text-sm text-muted-foreground mb-4">A list of all users with access to your organisation.</p>
          {/* Search */}
          <div className="relative max-w-xs">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              className="pl-9"
              placeholder="Search team..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
        </div>

        {isLoading ? (
          <ModuleLoader />
        ) : read.isLoadingError ? (
          <LoadError failure={read} title="Couldn’t load team members" />
        ) : (
          <StaffTable
            members={filtered}
            selectedId={selectedId}
            onSelect={setSelectedId}
            onView={(m) => openPane(m)}
          />
        )}
      </div>

      <SingleRecordActionBar
        open={!!selectedMember && !pane && !removeMember}
        onView={() => openPane(selectedMember)}
        onEdit={() => openPane(selectedMember, true)}
        // You can't remove your own access.
        onDelete={selectedMember?.id !== user?.id ? () => setRemoveMember(selectedMember) : undefined}
        onClear={() => setSelectedId(null)}
      />

      {/* Modals */}
      <AddStaffModal
        open={addOpen}
        onClose={() => setAddOpen(false)}
        onAdd={(data) => addMutation.mutateAsync(data)}
      />
      <StaffMemberPane
        onClose={() => setPane(null)}
        member={pane?.member || null}
        startInEdit={!!pane?.edit}
        onSave={(data) => updateMutation.mutateAsync(data)}
        onSendInvite={handleSendInvite}
      />
      <RemoveStaffModal
        open={!!removeMember}
        onClose={() => setRemoveMember(null)}
        member={removeMember}
        onConfirm={(m) => removeMutation.mutateAsync(m)}
      />
    </div>
  );
}