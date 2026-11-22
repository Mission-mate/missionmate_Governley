import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { AnimatePresence, motion } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

/**
 * Type-DELETE confirmation before permanently removing a task, milestone or section.
 * Rendered in a portal above slide-in panes so it stays usable from a detail pane.
 */
export default function DeleteTaskDialog({ isOpen, task, onClose, onConfirm }) {
  const [text, setText] = useState('');
  const [busy, setBusy] = useState(false);
  useEffect(() => { if (isOpen) { setText(''); setBusy(false); } }, [isOpen]);

  const isSection = task?.type === 'section';
  const kind = isSection ? 'section' : task?.type === 'milestone' ? 'milestone' : 'task';

  const confirm = async () => {
    if (text !== 'DELETE' || busy) return;
    setBusy(true);
    try { await onConfirm(); } finally { setBusy(false); }
  };

  if (typeof document === 'undefined') return null;

  return createPortal(
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center p-4">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.15 }}
            className="absolute inset-0 bg-black/50"
            onClick={onClose}
          />
          <motion.div
            initial={{ opacity: 0, scale: 0.97, y: 8 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.97, y: 8 }}
            transition={{ duration: 0.18, ease: [0.16, 1, 0.3, 1] }}
            className="relative z-10 w-full sm:max-w-[460px] bg-card rounded-2xl shadow-2xl p-6 space-y-4"
          >
            <h2 className="text-lg font-semibold text-foreground">Delete {kind}?</h2>
            <p className="text-sm text-muted-foreground">
              This confirms the permanent deletion of the {kind} <span className="font-semibold text-foreground">{task?.title}</span>.
              {isSection
                ? ' Tasks grouped under it will be kept and moved back to the ungrouped list.'
                : ' This will delete all associated subtasks, progress notes, and document links.'} This action cannot be undone.
              Type <span className="font-semibold text-foreground">DELETE</span> to confirm.
            </p>
            <div className="space-y-1.5">
              <Label>Confirmation</Label>
              <Input value={text} onChange={(e) => setText(e.target.value)} placeholder="DELETE" autoFocus />
            </div>
            <div className="flex justify-end gap-2 pt-1">
              <Button variant="outline" onClick={onClose}>Cancel</Button>
              <Button
                disabled={text !== 'DELETE' || busy}
                onClick={confirm}
                className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              >
                {busy ? 'Deleting...' : 'Delete'}
              </Button>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>,
    document.body
  );
}