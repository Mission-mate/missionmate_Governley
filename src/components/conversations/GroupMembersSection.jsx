import React, { useState } from 'react';
import { Plus } from 'lucide-react';
import DetailsSection from './details/DetailsSection';
import GroupMemberRow from './GroupMemberRow';
import AddMembersModal from './AddMembersModal';
import ConfirmDeleteDialog from '@/components/shared/ConfirmDeleteDialog';
import { isGroupAdmin, personName } from '@/lib/conversations';

const confirmCopy = ({ type }, name, group) => {
  const where = group || 'this group';
  if (type === 'remove') return { title: 'Remove from group', message: `${name} will stop receiving messages from ${where} and lose access to its history until someone adds them back.` };
  if (type === 'make') return { title: 'Make admin', message: `${name} will be able to rename ${where}, manage members and admins, and delete the group.` };
  return { title: 'Remove admin', message: `${name === 'yourself' ? 'You' : name} will no longer be able to manage ${where}, its members or its admins.` };
};

/**
 * Members of a group. Group admins can add and remove members and change who is an admin.
 * `onRemove(id)` / `onSetAdmin(id, admin)` resolve once saved; `onAdded(conversation)` receives the group after adding.
 */
export default function GroupMembersSection({ conversation, meId, people, candidates, busy, onRemove, onAdded, onSetAdmin, children }) {
  const canManage = isGroupAdmin(conversation, meId);
  const [adding, setAdding] = useState(false);
  // Member action awaiting typed confirmation: { type: 'remove' | 'make' | 'revoke', id }.
  const [pending, setPending] = useState(null);
  const copy = pending && confirmCopy(pending, pending.id === meId ? 'yourself' : personName(people, pending.id), conversation.name);

  const confirm = async () => {
    const { type, id } = pending;
    await (type === 'remove' ? onRemove(id) : onSetAdmin(id, type === 'make'));
    setPending(null);
  };

  return (
    <DetailsSection>
      <div className="-mx-2">
        {conversation.member_ids.map((id) => (
          <GroupMemberRow
            key={id}
            id={id}
            meId={meId}
            people={people}
            isAdmin={isGroupAdmin(conversation, id)}
            canManage={canManage}
            busy={busy}
            onSetAdmin={(memberId, admin) => setPending({ type: admin ? 'make' : 'revoke', id: memberId })}
            onRemove={(memberId) => setPending({ type: 'remove', id: memberId })}
          />
        ))}
        {canManage && (
          <button
            type="button"
            onClick={() => setAdding(true)}
            disabled={busy}
            className="w-full flex items-center gap-3 px-2 py-1.5 rounded-lg text-left text-sm font-semibold text-primary hover:bg-muted/60 transition-colors duration-200 disabled:opacity-60"
          >
            <span className="w-8 h-8 rounded-full border border-dashed border-primary/50 flex items-center justify-center shrink-0">
              <Plus className="w-4 h-4" strokeWidth={1.8} />
            </span>
            Add member
          </button>
        )}
      </div>

      {canManage && (
        <AddMembersModal
          isOpen={adding}
          onClose={() => setAdding(false)}
          conversation={conversation}
          candidates={candidates}
          onAdded={(saved) => { setAdding(false); onAdded(saved); }}
        />
      )}
      {canManage && (
        <ConfirmDeleteDialog
          isOpen={!!pending}
          onClose={() => setPending(null)}
          title={copy?.title}
          message={copy?.message}
          confirmLabel={copy?.title}
          busyLabel="Saving..."
          requireKeyword="CONFIRM"
          onConfirm={confirm}
        />
      )}
      {children}
    </DetailsSection>
  );
}