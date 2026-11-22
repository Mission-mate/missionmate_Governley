import React, { useEffect, useRef, useState } from 'react';
import DiscardChangesDialog from '@/components/shared/DiscardChangesDialog';
import { draftEqual } from '@/lib/unsavedChanges/draftEqual';
import { setEditorDirty } from '@/lib/unsavedChanges/dirtyRegistry';

/**
 * Shared unsaved-changes guard.
 *   const guard = useUnsavedChanges({ draft, baseline, onClose });
 *   <SlidePane onClose={guard.requestClose}> … {guard.dialog}
 *
 * Options:
 *  - select(value): project draft/baseline before comparing (narrow fields)
 *  - enabled: false = inert (read-only / view mode)
 *  - saving: guard stays silent while a save is in flight; a close requested
 *    meanwhile is queued and runs when the save lands (dropped if it failed)
 *  - childOpen + closeChild: an inner dialog/step closes first, pane stays open
 *  - subject: wording for the dialog, e.g. "field configuration changes"
 * requestClose(action?) runs `action` (default onClose) directly when clean,
 * or after "Discard Changes" when dirty.
 */
export default function useUnsavedChanges({
  draft, baseline, onClose, select = (v) => v, enabled = true, saving = false,
  childOpen = false, closeChild, subject,
}) {
  const [pending, setPending] = useState(null);
  const idRef = useRef(`editor_${Math.random().toString(36).slice(2)}`);
  const isDirty = enabled && !draftEqual(select(draft), select(baseline));

  useEffect(() => {
    const id = idRef.current;
    setEditorDirty(id, isDirty && !saving);
    return () => setEditorDirty(id, false);
  }, [isDirty, saving]);

  // Close requested mid-save: remember it (latest wins) and run it once the
  // save lands. If the draft still differs after a short settle window (the
  // saved record may refresh a beat after the flag clears), the save is
  // treated as failed and the queued close is dropped — never a silent discard.
  const queuedRef = useRef(null);
  useEffect(() => {
    if (saving || !queuedRef.current) return;
    if (!isDirty) { const run = queuedRef.current; queuedRef.current = null; run?.(); return; }
    const t = setTimeout(() => { queuedRef.current = null; }, 1500);
    return () => clearTimeout(t);
  }, [saving, isDirty]);

  const requestClose = (action) => {
    const run = typeof action === 'function' ? action : onClose;
    if (childOpen) { closeChild?.(); return; }
    if (saving) { queuedRef.current = run; return; }
    if (isDirty) { setPending(() => run); return; }
    run?.();
  };

  const dialog = (
    <DiscardChangesDialog
      isOpen={!!pending}
      subject={subject}
      onClose={() => setPending(null)}
      onConfirm={() => { const run = pending; setPending(null); run?.(); }}
    />
  );

  return { isDirty, requestClose, dialog };
}