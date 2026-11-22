import React, { useState } from 'react';
import DiscardChangesDialog from '@/components/shared/DiscardChangesDialog';
import { hasDirtyEditors } from '@/lib/unsavedChanges/dirtyRegistry';

/**
 * Page-level guard for tab switches and back links. Aggregates every dirty
 * editor registered on screen (inline cards, builders, templates), so the page
 * doesn't need to know which child holds the draft.
 *   const leave = usePageLeaveGuard();
 *   onClick={() => leave.guard(() => navigate('/x'))}   … {leave.dialog}
 * "Keep Editing" cancels the action; a second request while the prompt is
 * already showing is ignored.
 */
export default function usePageLeaveGuard(subject) {
  const [pending, setPending] = useState(null);

  const guard = (action) => {
    if (pending) return;
    if (hasDirtyEditors()) { setPending(() => action); return; }
    action();
  };

  const dialog = (
    <DiscardChangesDialog
      isOpen={!!pending}
      subject={subject}
      onClose={() => setPending(null)}
      onConfirm={() => { const run = pending; setPending(null); run?.(); }}
    />
  );

  return { guard, dialog };
}