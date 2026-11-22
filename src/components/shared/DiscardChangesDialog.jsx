import React from 'react';
import { Button } from '@/components/ui/button';
import ModalOverlay from '@/components/ui/ModalOverlay';
import { openPaneCount } from '@/components/ui/usePaneStack';

/**
 * Shared "Discard changes?" guard. Always layers above the topmost open pane
 * (pane z-index grows with nesting depth, so a fixed layer isn't safe).
 */
export default function DiscardChangesDialog({ isOpen, onConfirm, onClose, subject = 'changes' }) {
  const zIndex = Math.max(140, 102 + openPaneCount() * 2);
  return (
    <ModalOverlay isOpen={isOpen} onClose={onClose} className="w-full max-w-sm" zIndex={zIndex}>
      <div className="bg-white dark:bg-card rounded-xl shadow-2xl p-6">
        <h2 className="text-lg font-bold text-foreground mb-2">Discard changes?</h2>
        <p className="text-sm text-muted-foreground mb-5">
          Your {subject} haven't been saved. Closing now will discard them.
        </p>
        <div className="flex items-center justify-end gap-3">
          <Button variant="outline" onClick={onClose}>Keep Editing</Button>
          <Button variant="destructive" onClick={onConfirm}>Discard Changes</Button>
        </div>
      </div>
    </ModalOverlay>
  );
}