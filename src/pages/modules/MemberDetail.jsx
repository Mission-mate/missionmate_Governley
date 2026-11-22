import React, { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import TopBarBack from '@/components/shared/TopBarBack';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { BadgeCheck } from 'lucide-react';
import { base44 } from '@/api/base44Client';
import CapsuleTabs from '@/components/board/CapsuleTabs';
import useRecordTabCounts from '@/hooks/useRecordTabCounts';
import { useToast } from '@/components/ui/use-toast';
import MemberOverviewTab from '@/components/membership/MemberOverviewTab';
import MemberActionsMenu from '@/components/membership/MemberActionsMenu';
import DeleteMemberDialog from '@/components/membership/DeleteMemberDialog';
import NotesTab from '@/components/notes/NotesTab';
import DocumentsTab from '@/components/documents/DocumentsTab';
import ModuleLoader from '@/components/shared/states/ModuleLoader';
import LoadError from '@/components/shared/states/LoadError';
import { getOrNull } from '@/lib/readState';
import usePageLeaveGuard from '@/hooks/usePageLeaveGuard';

const STATUS_STYLES = {
  active: 'bg-green-50 text-green-700 border-green-200',
  pending: 'bg-amber-50 text-amber-700 border-amber-200',
  expired: 'bg-red-50 text-red-700 border-red-200',
};

const initials = (m) =>
  `${(m.first_name || '').charAt(0)}${(m.last_name || '').charAt(0)}`.toUpperCase() || '?';

export default function MemberDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const qc = useQueryClient();
  const { toast } = useToast();
  const [tab, setTab] = useState('overview');
  const [deleteOpen, setDeleteOpen] = useState(false);
  const leave = usePageLeaveGuard();
  const counts = useRecordTabCounts('member', id);

  const { data: currentUser } = useQuery({
    queryKey: ['me'],
    queryFn: () => base44.auth.me(),
  });

  const { data: member, isLoading, ...read } = useQuery({
    queryKey: ['member', id],
    queryFn: () => getOrNull(() => base44.entities.Member.get(id)),
  });

  const refresh = async () => {
    await qc.invalidateQueries({ queryKey: ['member', id] });
    qc.invalidateQueries({ queryKey: ['members'] });
  };

  const handleDelete = async () => {
    await base44.entities.Member.delete(id);
    qc.invalidateQueries({ queryKey: ['members'] });
    setDeleteOpen(false);
    navigate('/membership/members');
  };

  if (isLoading) {
    return <ModuleLoader fullPage />;
  }

  if (read.isLoadingError) {
    return <LoadError page failure={read} title="Couldn’t load this member" />;
  }

  if (!member) {
    return (
      <div className="p-6 max-w-[1100px] mx-auto">
        <TopBarBack onClick={() => navigate('/membership/members')}>Back to Membership Register</TopBarBack>
        <p className="mt-8 text-center text-muted-foreground">Member not found.</p>
      </div>
    );
  }

  const statusLabel = member.status ? member.status.charAt(0).toUpperCase() + member.status.slice(1) : '–';

  return (
    <div className="p-6 max-w-[1100px] mx-auto">
      {/* Header */}
      <div className="flex items-start justify-between gap-4 mb-6 flex-wrap">
        <div className="flex items-center gap-4">
          {leave.dialog}
          <TopBarBack onClick={() => leave.guard(() => navigate('/membership/members'))}>Back to Membership Register</TopBarBack>
          <div className="w-12 h-12 rounded-full bg-blue-100 flex items-center justify-center text-blue-700 font-semibold">
            {initials(member)}
          </div>
          <div>
            <h1 className="text-2xl font-bold text-foreground">{member.first_name} {member.last_name}</h1>
            <div className="flex items-center gap-2 mt-1">
              <span className={`inline-flex items-center text-xs font-medium border rounded-full px-2.5 py-0.5 ${STATUS_STYLES[member.status] || 'bg-muted text-muted-foreground border-border'}`}>
                {statusLabel}
              </span>
              {member.membership_structure_name && (
                <span className="inline-flex items-center gap-1 text-sm text-muted-foreground">
                  <BadgeCheck className="w-4 h-4 text-primary" />
                  {member.membership_structure_name}
                </span>
              )}
            </div>
          </div>
        </div>

        <MemberActionsMenu
          onSendRenewalReminder={() => toast({ title: 'Renewal reminder', description: 'Email templates coming soon.' })}
          onSendPaymentReminder={() => toast({ title: 'Payment reminder', description: 'Email templates coming soon.' })}
          onDelete={() => setDeleteOpen(true)}
        />
      </div>

      {/* Tabs — capsule style */}
      <div className="mb-6 overflow-x-auto">
        <CapsuleTabs animated
          value={tab}
          onChange={(v) => { if (v !== tab) leave.guard(() => setTab(v)); }}
          tabs={[
            { value: 'overview', label: 'Overview' },
            { value: 'notes', label: 'Notes', count: counts.notes },
            { value: 'documents', label: 'Documents', count: counts.documents },
          ]}
        />
      </div>

      {/* Content */}
      {tab === 'overview' && (
        <MemberOverviewTab member={member} onSaved={refresh} />
      )}
      {tab === 'notes' && (
        <NotesTab objectType="member" objectId={member.id} currentUser={currentUser} />
      )}
      {tab === 'documents' && (
        <DocumentsTab objectType="member" objectId={member.id} />
      )}

      <DeleteMemberDialog
        isOpen={deleteOpen}
        member={member}
        onClose={() => setDeleteOpen(false)}
        onConfirm={handleDelete}
      />
    </div>
  );
}