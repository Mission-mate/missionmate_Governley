import React, { useState } from 'react';
import { Pencil, Trash2 } from 'lucide-react';
import IconTip from '@/components/shared/IconTip';
import ConfirmDeleteDialog from '@/components/shared/ConfirmDeleteDialog';
import { toast } from '@/components/ui/use-toast';
import EditGroupModal from './EditGroupModal';
import { deleteConversation, apiErrorMessage } from '@/lib/conversationsApi';
import { isGroupAdmin } from '@/lib/conversations';

/**
 * Edit and Delete for the open conversation; deleting needs DELETE typed.
 * In a group both are for group admins only and deleting removes it for every member.
 * Deleting a direct conversation hides it from the caller's list only.
 * `onChanged(conversation)` receives an edited group; `onDeleted()` runs once the conversation is gone.
 */
export default function ThreadHeaderActions({ conversation, meId, title, buttonClassName, onChanged, onDeleted }) {
  const [editOpen, setEditOpen] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const isGroup = conversation.type === 'group';
  if (isGroup && !isGroupAdmin(conversation, meId)) return null;

  const confirmDelete = async () => {
    try {
      await deleteConversation(conversation.id);
      setDeleteOpen(false);
      onDeleted();
    } catch (err) {
      toast({ variant: 'destructive', title: 'Couldn’t delete the conversation', description: apiErrorMessage(err) });
    }
  };

  return (
    <>
      {isGroup && (
        <IconTip label="Edit group">
          <button type="button" onClick={() => setEditOpen(true)} className={buttonClassName}>
            <Pencil className="w-[17px] h-[17px]" strokeWidth={1.8} />
            <span className="sr-only">Edit group</span>
          </button>
        </IconTip>
      )}
      <IconTip label={isGroup ? 'Delete group' : 'Delete conversation'}>
        <button type="button" onClick={() => setDeleteOpen(true)} className={`${buttonClassName} hover:!text-destructive`}>
          <Trash2 className="w-[17px] h-[17px]" strokeWidth={1.8} />
          <span className="sr-only">{isGroup ? 'Delete group' : 'Delete conversation'}</span>
        </button>
      </IconTip>

      {isGroup && (
        <EditGroupModal
          isOpen={editOpen}
          onClose={() => setEditOpen(false)}
          conversation={conversation}
          onSaved={(saved) => { setEditOpen(false); onChanged(saved); }}
        />
      )}
      <ConfirmDeleteDialog
        isOpen={deleteOpen}
        onClose={() => setDeleteOpen(false)}
        title={isGroup ? 'Delete group for everyone?' : 'Delete conversation?'}
        message={isGroup
          ? `“${title}” and all of its messages, polls and shared files will be permanently removed for every member. This can’t be undone.`
          : `This conversation will be removed from your list only. ${title} will still see it, and it returns to your list if either of you sends a new message.`}
        requireKeyword="DELETE"
        confirmLabel={isGroup ? 'Delete for everyone' : 'Delete for me'}
        onConfirm={confirmDelete}
      />
    </>
  );
}