import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { AnimatePresence, motion } from 'framer-motion';
import { X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

/**
 * Type-DELETE confirmation for removing a Level 6 reporting entry.
 * `target` = { kind: 'period' | 'location', label, message } describing the
 * cascade (a period is removed from all locations / a location from all periods).
 * Shares the task/milestone delete dialog's portal + motion shell.
 */
export default function DeleteReportRowDialog({ isOpen, target, onClose, onConfirm }) {
  const [text, setText] = useState('');
  const [busy, setBusy] = useState(false);
  useEffect(() => { if (isOpen) { setText(''); setBusy(false); } }, [isOpen]);

  const confirm = async () => {
    setBusy(true);
    try { await onConfirm(); onClose(); } finally { setBusy(false); }
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
            className="relative z-10 w-full sm:max-w-[440px] bg-card border border-border rounded-2xl shadow-2xl p-6 space-y-4"
          >
            <button onClick={onClose} className="absolute right-4 top-4 rounded-sm opacity-70 hover:opacity-100 transition-opacity">
              <X className="h-4 w-4" />
            </button>
            <h2 className="text-lg font-semibold text-foreground pr-6">
              Delete {target?.kind === 'location' ? 'Location' : 'Period'} "{target?.label}"?
            </h2>
            <p className="text-sm text-muted-foreground">
              {target?.message} This cannot be undone. Type <span className="font-semibold text-foreground">DELETE</span> to confirm.
            </p>
            <div className="space-y-1.5 pt-1">
              <Label>Confirmation</Label>
              <Input value={text} onChange={(e) => setText(e.target.value)} placeholder="DELETE" autoFocus />
            </div>
            <div className="flex justify-end gap-2 pt-2">
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