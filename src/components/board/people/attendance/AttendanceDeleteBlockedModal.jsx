import React from 'react';
import { Info } from 'lucide-react';
import { Button } from '@/components/ui/button';
import ModalOverlay from '@/components/ui/ModalOverlay';

/** Shown when the person is still in the Committee Members Register. */
export default function AttendanceDeleteBlockedModal({ memberName, isOpen, onClose }) {
  return (
    <ModalOverlay isOpen={isOpen} onClose={onClose}>
      <div className="bg-card w-[28rem] max-w-[92vw] rounded-2xl shadow-xl border border-border p-6">
        <div className="flex items-start gap-3 mb-4">
          <div className="w-10 h-10 rounded-full bg-primary/10 text-primary flex items-center justify-center shrink-0">
            <Info className="w-5 h-5" />
          </div>
          <div>
            <h2 className="font-bold text-lg text-foreground">Cannot delete attendance record</h2>
          </div>
        </div>
        <p className="text-sm text-muted-foreground mb-6">
          Committee member <span className="font-medium text-foreground">{memberName}</span> must be removed from
          the Committee Members Register before removing their attendance record.
        </p>
        <div className="flex justify-end">
          <Button onClick={onClose}>OK</Button>
        </div>
      </div>
    </ModalOverlay>
  );
}