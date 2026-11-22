import React, { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import { Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import MotionModal from '@/components/shared/MotionModal';
import MemberPicker from './MemberPicker';
import { addMembers, apiErrorMessage } from '@/lib/conversationsApi';

/** Adds team members to a group. `onAdded(conversation)` receives the saved group. */
export default function AddMembersModal({ isOpen, onClose, conversation, candidates, onAdded }) {
  const [selectedIds, setSelectedIds] = useState([]);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const available = candidates.filter((p) => !conversation.member_ids.includes(p.id));

  useEffect(() => {
    if (!isOpen) return;
    setSelectedIds([]);
    setBusy(false);
    setError('');
  }, [isOpen]);

  const toggle = (id) => setSelectedIds((ids) => (ids.includes(id) ? ids.filter((x) => x !== id) : [...ids, id]));

  const save = async () => {
    setBusy(true);
    setError('');
    try {
      onAdded(await addMembers(conversation.id, selectedIds));
    } catch (err) {
      setError(apiErrorMessage(err));
      setBusy(false);
    }
  };

  // Rendered at the page root: the details rail is animated, which would otherwise confine the overlay to it.
  return createPortal(
    <MotionModal
      isOpen={isOpen}
      onClose={onClose}
      title="Add members"
      maxWidth="max-w-md"
      footer={(
        <>
          <Button variant="outline" onClick={onClose} disabled={busy}>Cancel</Button>
          <Button onClick={save} disabled={busy || selectedIds.length === 0}>
            {busy ? <><Loader2 className="w-4 h-4 animate-spin" /> Adding...</> : 'Add to group'}
          </Button>
        </>
      )}
    >
      <p className="text-sm font-medium text-foreground mb-2">
        {`Team members${selectedIds.length ? ` (${selectedIds.length} selected)` : ''}`}
      </p>
      <MemberPicker candidates={available} selectedIds={selectedIds} onPick={toggle} disabled={busy} />
      {error && <p className="text-sm text-destructive mt-3">{error}</p>}
    </MotionModal>,
    document.body,
  );
}