import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import ModalOverlay from '@/components/ui/ModalOverlay';
import { toast } from '@/components/ui/use-toast';
import FolderIcon, { FOLDER_COLORS } from '@/components/documents/FolderIcon';
import { cn } from '@/lib/utils';
import useUnsavedChanges from '@/hooks/useUnsavedChanges';

/** Create / edit a folder. The folder icon sits in front of the title and follows the chosen colour. */
export default function FolderFormModal({ isOpen, mode, initialName = '', initialColor = 'orange', onConfirm, onCancel, overlayClassName = 'z-50' }) {
  const [name, setName] = useState(initialName);
  const [color, setColor] = useState(initialColor);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (isOpen) { setName(initialName); setColor(initialColor); setSaving(false); }
  }, [isOpen]);

  const handle = async () => {
    if (!name.trim() || saving) return;
    setSaving(true);
    try {
      await onConfirm(name.trim(), color);
    } catch (err) {
      toast({ variant: 'destructive', title: 'Couldn’t save folder', description: 'Something went wrong. Please try again.' });
    } finally {
      setSaving(false);
    }
  };

  const guard = useUnsavedChanges({
    draft: { name, color },
    baseline: { name: initialName, color: initialColor },
    onClose: onCancel,
    saving,
    enabled: isOpen,
  });

  return (
    <ModalOverlay isOpen={isOpen} onClose={guard.requestClose} className="w-full max-w-sm" overlayClassName={overlayClassName}>
      <div className="bg-card rounded-xl shadow-2xl p-6">
        <h2 className="text-lg font-bold text-foreground mb-5">{mode === 'edit' ? 'Edit Folder' : 'Create New Folder'}</h2>

        <label className="text-xs font-semibold text-foreground block mb-1.5">Folder Name</label>
        <div className="flex items-center gap-2.5 mb-4">
          <div className="h-9 w-9 shrink-0 rounded-md border border-input bg-muted/40 flex items-center justify-center">
            <FolderIcon color={color} size={22} />
          </div>
          <Input
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="e.g. Invoices"
            autoFocus
            onKeyDown={(e) => e.key === 'Enter' && handle()} />
        </div>

        <label className="text-xs font-semibold text-foreground block mb-2">Folder Colour</label>
        <div className="flex items-center gap-3 mb-6">
          {FOLDER_COLORS.map((c) => (
            <button
              key={c.key}
              type="button"
              onClick={() => setColor(c.key)}
              aria-label={`${c.key} folder`}
              aria-pressed={color === c.key}
              className={cn(
                'w-10 h-10 rounded-lg flex items-center justify-center transition-all',
                color === c.key ? 'ring-2 ring-offset-2 ring-offset-card ring-foreground scale-110' : 'hover:scale-105'
              )}
              style={{ background: c.front }}
              title={c.key}>
              <FolderIcon color={c.key} size={22} />
            </button>
          ))}
        </div>

        <div className="flex items-center justify-end gap-3">
          <Button variant="outline" onClick={() => guard.requestClose()}>Cancel</Button>
          <Button onClick={handle} disabled={!name.trim() || saving}>
            {saving ? 'Saving...' : mode === 'edit' ? 'Save Changes' : 'Create Folder'}
          </Button>
        </div>
      </div>
      {guard.dialog}
    </ModalOverlay>
  );
}