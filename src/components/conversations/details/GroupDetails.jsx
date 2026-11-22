import React, { useState } from 'react';
import { toast } from '@/components/ui/use-toast';
import CapsuleTabs from '@/components/board/CapsuleTabs';
import GroupMembersSection from '../GroupMembersSection';
import SharedFilesSection, { sharedFilesCount } from './SharedFilesSection';
import LeaveGroupButton from './LeaveGroupButton';
import { removeMember, setGroupAdmin, apiErrorMessage } from '@/lib/conversationsApi';

/** Group part of the details panel: Members (manage, or leave) and Shared files, each in its own tab. */
export default function GroupDetails({ conversation, meId, people, candidates, onChanged, shared, canDelete, onFileDeleted }) {
  const [busy, setBusy] = useState(false);
  const [tab, setTab] = useState('members');

  // Runs one change, reports the updated conversation (null once the group is gone), and surfaces failures.
  const run = async (request) => {
    setBusy(true);
    try {
      onChanged(await request());
    } catch (err) {
      toast({ variant: 'destructive', title: 'Couldn’t update the group', description: apiErrorMessage(err) });
    } finally {
      setBusy(false);
    }
  };

  const tabs = [
    { value: 'members', label: 'Members', count: conversation.member_ids.length },
    { value: 'files', label: 'Shared files', count: sharedFilesCount(shared) },
  ];

  return (
    <>
      <div className="px-5 pt-4">
        <CapsuleTabs animated tabs={tabs} value={tab} onChange={setTab} size="sm" raised className="w-full" tabClassName="flex-1 justify-center" />
      </div>
      {tab === 'members' ? (
        <GroupMembersSection
          conversation={conversation}
          meId={meId}
          people={people}
          candidates={candidates}
          busy={busy}
          onRemove={(id) => run(() => removeMember(conversation.id, id))}
          onAdded={onChanged}
          onSetAdmin={(id, admin) => run(() => setGroupAdmin(conversation.id, id, admin))}
        >
          <LeaveGroupButton groupName={conversation.name} busy={busy} onLeave={() => run(() => removeMember(conversation.id, meId))} />
        </GroupMembersSection>
      ) : (
        <SharedFilesSection shared={shared} canDelete={canDelete} onFileDeleted={onFileDeleted} />
      )}
    </>
  );
}