import React from 'react';
import { AlertTriangle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import ModalOverlay from '@/components/ui/ModalOverlay';

/** Shown instead of the delete confirmation when the selected version is Current. */
export default function CurrentVersionDeleteBlocked({ isOpen, onClose }) {
  return (
    <ModalOverlay isOpen={isOpen} onClose={onClose}>
      <div className="bg-card w-[28rem] max-w-[92vw] rounded-2xl shadow-xl border border-border p-6">
        <div className="flex items-center gap-3 mb-3">
          <div className="w-9 h-9 rounded-lg bg-amber-100 dark:bg-amber-500/15 flex items-center justify-center">
            <AlertTriangle className="w-5 h-5 text-amber-600 dark:text-amber-400" />
          </div>
          <h2 className="font-bold text-lg text-foreground">Cannot Delete Current Document</h2>
        </div>
        <p className="text-sm text-muted-foreground mb-5">This document must be superseded before it can be deleted.</p>
        <div className="flex justify-end"><Button variant="outline" onClick={onClose}>Close</Button></div>
      </div>
    </ModalOverlay>
  );
}