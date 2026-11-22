import React, { useState, useEffect } from 'react';
import { useQueryClient, useQuery } from '@tanstack/react-query';
import { Archive, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import ModalOverlay from '@/components/ui/ModalOverlay';
import ConfirmTypeDialog from '@/components/board/documents/ConfirmTypeDialog';
import { cn } from '@/lib/utils';
import { useAuth } from '@/lib/AuthContext';
import { useConflictScope } from '@/lib/conflictScope';
import { deleteCoiPerson, countCoiPersonDeclarations } from '@/lib/coiPersonProfile';

const OPTIONS = [
  { keep: true, icon: Archive, label: 'Keep associated declarations', hint: 'Declarations stay in the register, left blank without a person.' },
  { keep: false, icon: Trash2, label: 'Delete all associated declarations', hint: 'Declarations and their actions, notes and documents are permanently deleted.' },
];

/** Two-step person profile deletion: choose what happens to declarations, then type DELETE. */
export default function DeleteCoiPersonDialog({ person, onClose, onDeleted }) {
  const { registerId } = useConflictScope();
  const qc = useQueryClient();
  const [keep, setKeep] = useState(null);
  const [confirming, setConfirming] = useState(false);
  const [error, setError] = useState('');
  const { user } = useAuth();
  const isAdmin = user?.role === 'admin';

  const { data: count } = useQuery({
    queryKey: ['coiPersonDeclarationCount', registerId, person?.user_id],
    queryFn: () => countCoiPersonDeclarations(registerId, person.user_id),
    enabled: !!person,
    staleTime: 0,
  });
  const countText = count == null ? '…' : `${count} declaration${count === 1 ? '' : 's'}`;

  useEffect(() => { if (person) { setKeep(null); setConfirming(false); setError(''); } }, [person]);

  // Deleting declarations is admin-only (enforced on the server too).
  const adminOnly = !isAdmin && count > 0;

  const confirm = async () => {
    setError('');
    try {
      await deleteCoiPerson(registerId, person.user_id, keep);
    } catch (err) {
      setError(err.message);
      return;
    }
    qc.invalidateQueries({ queryKey: ['coiPeople', registerId] });
    qc.invalidateQueries({ queryKey: ['conflictsOfInterest', registerId] });
    onDeleted?.(person);
    onClose();
  };

  const name = person?.name || '';
  const message = keep
    ? `"${name}" will be permanently deleted. Their ${countText} will be kept, but left blank without a person.`
    : `"${name}" and their ${countText} will be permanently deleted. This cannot be undone.`;

  return (
    <>
      <ModalOverlay isOpen={!!person && !confirming} onClose={onClose} className="w-full max-w-md" overlayClassName="z-[130]">
        <div className="bg-white dark:bg-card rounded-xl shadow-2xl p-6">
          <h2 className="text-lg font-bold text-foreground mb-1">Delete person profile</h2>
          <p className="text-sm text-muted-foreground mb-3">What should happen to the declarations linked to "{name}"?</p>
          <div className="mb-4 inline-flex items-center gap-2 rounded-full bg-muted px-3 py-1 text-xs font-medium text-foreground">
            <span className="font-semibold">{countText}</span> associated
          </div>
          <div className="space-y-2 mb-5">
            {OPTIONS.map((o) => {
              const locked = !o.keep && adminOnly;
              return (
                <button key={o.label} type="button" disabled={locked} onClick={() => setKeep(o.keep)}
                  className={cn('w-full flex items-start gap-3 rounded-lg border p-3 text-left transition-colors disabled:cursor-not-allowed disabled:opacity-60',
                    keep === o.keep ? 'border-primary bg-primary/5' : 'border-border hover:bg-muted/50 disabled:hover:bg-transparent')}>
                  <o.icon className={cn('w-4 h-4 mt-0.5 shrink-0', o.keep ? 'text-primary' : 'text-destructive')} />
                  <span>
                    <span className="block text-sm font-medium text-foreground">{o.label}</span>
                    <span className="block text-xs text-muted-foreground">
                      {locked ? 'Only an admin can delete declarations. Ask an admin to complete this deletion.' : o.hint}
                    </span>
                  </span>
                </button>
              );
            })}
          </div>
          <div className="flex justify-end gap-3">
            <Button variant="outline" onClick={onClose}>Cancel</Button>
            <Button variant="destructive" disabled={keep === null} onClick={() => setConfirming(true)}>Continue</Button>
          </div>
        </div>
      </ModalOverlay>
      <ConfirmTypeDialog
        isOpen={!!person && confirming}
        title={keep ? 'Delete profile, keep declarations' : 'Delete profile and declarations'}
        message={message}
        confirmLabel="Delete"
        error={error}
        onConfirm={confirm}
        onClose={onClose}
        overlayClassName="z-[130]"
      />
    </>
  );
}