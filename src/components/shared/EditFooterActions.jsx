import React from 'react';
import { Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';

/**
 * Edit-mode footer actions shared by side panes: Cancel + Save Changes.
 * Both return the pane to view-only (the pane's handlers do that); Save is disabled until something changed.
 * A new record passes `dirty` as true with its own `saveLabel`, so Add is always available.
 */
export default function EditFooterActions({ dirty, onCancel, onSave, saving, saveDisabled = false, saveLabel = 'Save Changes' }) {
  return (
    <>
      <Button variant="outline" onClick={onCancel} disabled={saving}>Cancel</Button>
      <Button onClick={onSave} disabled={saving || saveDisabled || !dirty}>
        {saving ? <><Loader2 className="w-4 h-4 animate-spin" /> Saving...</> : saveLabel}
      </Button>
    </>
  );
}