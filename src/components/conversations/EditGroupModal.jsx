import React, { useEffect, useState } from 'react';
import { Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import MotionModal from '@/components/shared/MotionModal';
import ConversationAvatar from './ConversationAvatar';
import GroupColorPicker from './GroupColorPicker';
import { updateGroup, apiErrorMessage } from '@/lib/conversationsApi';
import { DEFAULT_GROUP_COLOR } from '@/lib/groupColors';

/** Renames and recolours a group. `onSaved(conversation)` receives the saved group. */
export default function EditGroupModal({ isOpen, onClose, conversation, onSaved }) {
  const [name, setName] = useState('');
  const [color, setColor] = useState(DEFAULT_GROUP_COLOR);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!isOpen) return;
    setName(conversation.name || '');
    setColor(conversation.color || DEFAULT_GROUP_COLOR);
    setBusy(false);
    setError('');
  }, [isOpen]);

  const trimmed = name.trim();
  const changed = trimmed !== (conversation.name || '') || color !== (conversation.color || DEFAULT_GROUP_COLOR);
  const canSave = !busy && trimmed.length > 0 && changed;

  const save = async () => {
    if (!canSave) return;
    setBusy(true);
    setError('');
    try {
      onSaved(await updateGroup(conversation.id, { name: trimmed, color }));
    } catch (err) {
      setError(apiErrorMessage(err));
      setBusy(false);
    }
  };

  return (
    <MotionModal
      isOpen={isOpen}
      onClose={onClose}
      title="Edit group"
      maxWidth="max-w-md"
      footer={(
        <>
          <Button variant="outline" onClick={onClose} disabled={busy}>Cancel</Button>
          <Button onClick={save} disabled={!canSave}>
            {busy ? <><Loader2 className="w-4 h-4 animate-spin" /> Saving...</> : 'Save changes'}
          </Button>
        </>
      )}
    >
      <div className="space-y-1.5 mb-4">
        <Label htmlFor="edit-group-name">Group name <span className="text-destructive">*</span></Label>
        <div className="flex items-center gap-2.5">
          <ConversationAvatar conversation={{ type: 'group', name: trimmed, color }} className="h-9 w-9" />
          <Input
            id="edit-group-name"
            autoFocus
            value={name}
            maxLength={80}
            onChange={(e) => setName(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && save()}
          />
        </div>
      </div>
      <p className="text-sm font-medium text-foreground mb-2.5">Group colour</p>
      <GroupColorPicker value={color} onChange={setColor} disabled={busy} />
      {error && <p className="text-sm text-destructive mt-3">{error}</p>}
    </MotionModal>
  );
}