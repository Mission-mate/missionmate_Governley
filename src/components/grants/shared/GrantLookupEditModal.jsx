import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import ModalOverlay from '@/components/ui/ModalOverlay';
import useUnsavedChanges from '@/hooks/useUnsavedChanges';

/** Rename a GrantProvider / GrantActivity record. */
export default function GrantLookupEditModal({ isOpen, record, entityLabel, onClose, onSave }) {
  const [name, setName] = useState('');
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setName(record?.name || '');
      setBusy(false);
    }
  }, [isOpen, record]);

  const handleSave = async () => {
    setBusy(true);
    try {
      await onSave(name.trim());
    } finally {
      setBusy(false);
    }
  };

  const guard = useUnsavedChanges({
    draft: { name },
    baseline: { name: record?.name || '' },
    onClose,
    saving: busy,
    enabled: isOpen,
  });

  return (
    <ModalOverlay isOpen={isOpen} onClose={guard.requestClose} className="w-full max-w-md" overlayClassName="z-[130]">
      <div className="bg-white dark:bg-card rounded-2xl shadow-2xl p-6">
        <h2 className="text-lg font-bold text-foreground mb-2">
          Edit {entityLabel}
        </h2>
        <p className="text-sm text-muted-foreground mb-4">
          Renaming updates this {entityLabel} everywhere it is used.
        </p>
        <Input
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="Name"
          autoFocus
          className="mb-5 text-sm"
        />
        <div className="flex items-center justify-end gap-3">
          <Button variant="outline" onClick={() => guard.requestClose()} disabled={busy}>Cancel</Button>
          <Button onClick={handleSave} disabled={busy || !name.trim() || name.trim() === record?.name}>
            {busy ? 'Saving…' : 'Save Changes'}
          </Button>
        </div>
      </div>
      {guard.dialog}
    </ModalOverlay>
  );
}