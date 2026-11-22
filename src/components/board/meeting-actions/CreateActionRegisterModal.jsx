import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import ModalOverlay from '@/components/ui/ModalOverlay';
import CloseButton from '@/components/shared/CloseButton';
import useUnsavedChanges from '@/hooks/useUnsavedChanges';

/** Create / edit modal for a board register. `noun` and the placeholders adapt it to other registers (e.g. Decisions). */
export default function CreateActionRegisterModal({
  isOpen, onClose, onSubmit, register,
  noun = 'Action Register',
  titlePlaceholder = 'e.g. 2025-26 Board Action Register',
  descriptionPlaceholder = 'e.g. Tracks all actions arising from Board and Committee meetings',
}) {
  const isEdit = !!register;
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [status, setStatus] = useState('active');
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setTitle(register?.title || '');
      setDescription(register?.description || '');
      setStatus(register?.status || 'active');
      setBusy(false);
    }
  }, [isOpen, register]);

  const handleSubmit = async () => {
    if (!title.trim() || busy) return;
    setBusy(true);
    try {
      await onSubmit({ title: title.trim(), description: description.trim(), status });
    } finally {
      setBusy(false);
    }
  };

  const guard = useUnsavedChanges({
    draft: { title, description, status },
    baseline: { title: register?.title || '', description: register?.description || '', status: register?.status || 'active' },
    onClose,
    saving: busy,
    enabled: isOpen,
  });

  return (
    <ModalOverlay isOpen={isOpen} onClose={guard.requestClose} className="w-full max-w-lg">
      <div className="bg-white dark:bg-card rounded-2xl shadow-2xl">
        {/* Header */}
        <div className="flex items-center justify-between px-6 pt-5 pb-4 border-b border-border">
          <h2 className="text-lg font-bold text-foreground">{isEdit ? `Edit ${noun}` : `Create New ${noun}`}</h2>
          <CloseButton onClick={() => guard.requestClose()} />
        </div>

        <div className="px-6 py-5 space-y-4">
          <div>
            <Label className="mb-1.5 block text-sm font-medium text-foreground">
              {noun} Title <span className="text-destructive">*</span>
            </Label>
            <Input
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder={titlePlaceholder}
              autoFocus
            />
          </div>

          <div>
            <Label className="mb-1.5 block text-sm font-medium text-foreground">Description (Optional)</Label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder={descriptionPlaceholder}
              rows={3}
              className="w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm outline-none resize-none focus:ring-1 focus:ring-ring placeholder:text-muted-foreground/50"
            />
          </div>

          <div>
            <Label className="mb-1.5 block text-sm font-medium text-foreground">Status</Label>
            <Select value={status} onValueChange={setStatus}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="active">Active</SelectItem>
                <SelectItem value="archived">Archive</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end gap-3 px-6 py-4 border-t border-border">
          <Button variant="outline" onClick={() => guard.requestClose()}>Cancel</Button>
          <Button onClick={handleSubmit} disabled={!title.trim() || busy}>
            {busy ? 'Saving...' : isEdit ? 'Save Changes' : 'Create'}
          </Button>
        </div>
      </div>
      {guard.dialog}
    </ModalOverlay>
  );
}