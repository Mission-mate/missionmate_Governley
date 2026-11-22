import React from 'react';
import { Archive, RotateCcw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import ModalOverlay from '@/components/ui/ModalOverlay';

/** Asks whether a parent policy's status change (archive or restore) should also apply to its linked documents. */
export default function ArchiveLinkedDialog({ isOpen, count, status = 'archived', onChoose, onClose }) {
  const archiving = status === 'archived';
  const verb = archiving ? 'archive' : 'restore';
  const Icon = archiving ? Archive : RotateCcw;
  return (
    <ModalOverlay isOpen={isOpen} onClose={onClose} className="w-full max-w-md">
      <div className="bg-card rounded-2xl shadow-2xl p-6">
        <div className="w-10 h-10 rounded-full bg-muted flex items-center justify-center mb-4"><Icon className="w-5 h-5 text-muted-foreground" /></div>
        <h3 className="text-lg font-bold text-foreground">{archiving ? 'Archive' : 'Restore'} linked documents?</h3>
        <p className="text-sm text-muted-foreground mt-1">
          This policy has {count} linked document{count === 1 ? '' : 's'}. Would you like to {verb} {count === 1 ? 'it' : 'them'} too{archiving ? '' : ' as Active'}?
        </p>
        <div className="flex justify-end gap-2 mt-6">
          <Button variant="ghost" onClick={onClose}>Cancel</Button>
          <Button variant="outline" onClick={() => onChoose(false)}>Policy only</Button>
          <Button onClick={() => onChoose(true)}>{archiving ? 'Archive' : 'Restore'} all</Button>
        </div>
      </div>
    </ModalOverlay>
  );
}