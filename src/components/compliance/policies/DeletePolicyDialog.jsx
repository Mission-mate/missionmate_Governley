import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import ModalOverlay from '@/components/ui/ModalOverlay';
import { cn } from '@/lib/utils';

const CHOICES = [
  { value: 'unlink', label: 'Remove links and keep documents', hint: 'Linked documents become standalone' },
  { value: 'delete', label: 'Delete linked documents', hint: 'Linked documents are permanently deleted too' },
];

/** Typed DELETE confirmation; for a parent with linked documents, the user picks what happens to them. */
export default function DeletePolicyDialog({ isOpen, title, linkedCount, onConfirm, onClose }) {
  const [typed, setTyped] = useState('');
  const [choice, setChoice] = useState('unlink');
  const [busy, setBusy] = useState(false);
  useEffect(() => { if (isOpen) { setTyped(''); setChoice('unlink'); setBusy(false); } }, [isOpen]);

  const confirm = async () => {
    setBusy(true);
    try { await onConfirm(linkedCount > 0 && choice === 'delete'); } finally { setBusy(false); }
  };

  return (
    <ModalOverlay isOpen={isOpen} onClose={onClose} className="w-full max-w-md" overlayClassName="z-[110]">
      <div className="bg-card rounded-xl shadow-2xl p-6">
        <h2 className="text-lg font-bold text-foreground mb-2">Delete Policy</h2>
        <p className="text-sm text-muted-foreground mb-4">
          This will permanently delete "<span className="font-semibold text-foreground">{title}</span>". This action cannot be undone.
        </p>
        {linkedCount > 0 && (
          <div className="mb-4">
            <p className="text-sm text-foreground mb-2">
              This policy has <span className="font-semibold">{linkedCount} linked document{linkedCount === 1 ? '' : 's'}</span>. What should happen to {linkedCount === 1 ? 'it' : 'them'}?
            </p>
            <div className="space-y-2">
              {CHOICES.map((c) => (
                <button key={c.value} type="button" onClick={() => setChoice(c.value)}
                  className={cn('w-full text-left rounded-lg border px-3 py-2.5 transition-colors',
                    choice === c.value ? 'border-primary bg-primary/10' : 'border-border hover:bg-muted/50')}>
                  <span className="block text-sm font-medium text-foreground">{c.label}</span>
                  <span className="block text-xs text-muted-foreground">{c.hint}</span>
                </button>
              ))}
            </div>
          </div>
        )}
        <p className="text-sm text-foreground mb-2">Type <span className="font-bold">DELETE</span> to confirm.</p>
        <Input value={typed} onChange={(e) => setTyped(e.target.value)} placeholder="DELETE" className="mb-5 text-sm" autoFocus />
        <div className="flex items-center justify-end gap-3">
          <Button variant="outline" onClick={onClose}>Cancel</Button>
          <Button variant="destructive" onClick={confirm} disabled={typed !== 'DELETE' || busy}>{busy ? 'Working...' : 'Delete'}</Button>
        </div>
      </div>
    </ModalOverlay>
  );
}