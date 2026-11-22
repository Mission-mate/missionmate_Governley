import React, { useState, useEffect } from 'react';
import ModalOverlay from '@/components/ui/ModalOverlay';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import CloseButton from '@/components/shared/CloseButton';
export default function RemoveStaffModal({ open, onClose, member, onConfirm }) {
  const [text, setText] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (open) setText('');
  }, [open]);

  if (!member) return null;
  const name = [member.first_name, member.last_name].filter(Boolean).join(' ') || member.email;
  const canRemove = text === 'CONFIRM';

  const handleConfirm = async () => {
    if (!canRemove) return;
    setLoading(true);
    try {
      await onConfirm(member);
      onClose();
    } finally {
      setLoading(false);
    }
  };

  return (
    <ModalOverlay isOpen={open} onClose={onClose}>
      <div className="bg-card w-[28rem] max-w-[92vw] rounded-2xl shadow-xl border border-border">
        <div className="flex items-center justify-between px-6 py-4 border-b border-border">
          <h2 className="font-bold text-lg text-foreground">Remove Team Member</h2>
          <CloseButton onClick={onClose} />
        </div>

        <div className="px-6 py-5 space-y-4">
          <p className="text-sm text-foreground">
            You are about to permanently remove <span className="font-semibold">{name}</span> from
            your organisation. They will lose all system access immediately. This action cannot be undone.
          </p>
          <div>
            <Label className="text-sm mb-1.5 block text-foreground">
              Type <span className="font-mono font-semibold">CONFIRM</span> to confirm
            </Label>
            <Input
              value={text}
              onChange={(e) => setText(e.target.value)}
              placeholder="CONFIRM"
              autoFocus />
            
          </div>
        </div>

        <div className="flex justify-end gap-2 px-6 py-4 border-t border-border">
          <Button variant="outline" onClick={onClose}>Cancel</Button>
          <Button variant="destructive" disabled={!canRemove || loading} onClick={handleConfirm}>
            {loading ? 'Removing...' : 'Remove Access'}
          </Button>
        </div>
      </div>
    </ModalOverlay>);

}