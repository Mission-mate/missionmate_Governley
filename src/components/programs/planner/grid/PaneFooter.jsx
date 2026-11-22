import React, { useRef } from 'react';
import { Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import EditFooterActions from '@/components/shared/EditFooterActions';

/**
 * Planner edit-mode footer: optional Delete on the left, the shared edit actions on the right.
 * Save is disabled while the form is unchanged (`dirty` false). Ignores repeat submits while saving.
 */
export default function PaneFooter({ onDelete, onCancel, onSave, saving, saveLabel, dirty = true }) {
  const pending = useRef(false);
  const submit = async () => {
    if (pending.current || saving) return;
    pending.current = true;
    try { await onSave(); } finally { pending.current = false; }
  };
  return (
    <>
      {onDelete && (
        <Button variant="ghost" onClick={onDelete} disabled={saving} className="gap-1.5 text-destructive hover:text-destructive">
          <Trash2 className="w-4 h-4" /> Delete
        </Button>
      )}
      <div className="ml-auto flex items-center gap-3">
        <EditFooterActions dirty={dirty} onCancel={onCancel} onSave={submit} saving={saving} saveLabel={saveLabel} />
      </div>
    </>
  );
}