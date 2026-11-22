import React, { useState, useEffect } from 'react';
import { FileWarning } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import ModalOverlay from '@/components/ui/ModalOverlay';

const KEYWORD = 'DELETE';

/**
 * Confirm deletion of a meeting — styled to match the shared typed-keyword
 * confirmation (ConfirmTypeDialog) used by the Action Register cards.
 *
 * Stays open when the delete fails — onConfirm must resolve to true only on
 * success, so a blocked or failed delete never makes the dialog vanish with the
 * meeting still there. `blocked` renders the "documents attached" explanation.
 */
export default function DeleteMeetingDialog({ isOpen, onClose, onConfirm, meetingTitle, blocked }) {
  const [typed, setTyped] = useState('');
  const [deleting, setDeleting] = useState(false);

  useEffect(() => { if (isOpen) { setTyped(''); setDeleting(false); } }, [isOpen]);

  const confirmed = typed === KEYWORD;

  const handleConfirm = async () => {
    if (!confirmed) return;
    setDeleting(true);
    const ok = await onConfirm();
    setDeleting(false);
    if (ok) onClose();
  };

  return (
    <ModalOverlay isOpen={isOpen} onClose={onClose} className="w-full max-w-sm" overlayClassName="z-[110]">
      <div className="bg-white dark:bg-card rounded-xl shadow-2xl p-6">
        <h2 className="text-lg font-bold text-foreground mb-2 break-words">Delete Meeting</h2>

        {blocked ? (
          <div className="rounded-lg border border-destructive/30 bg-destructive/5 p-3 mb-5">
            <div className="flex items-start gap-3">
              <FileWarning className="w-5 h-5 text-destructive shrink-0 mt-0.5" />
              <div className="min-w-0">
                <p className="text-sm font-semibold text-foreground">
                  {blocked.count} {blocked.count === 1 ? 'document is' : 'documents are'} still attached
                </p>
                <p className="text-sm text-muted-foreground mt-1">
                  This meeting can't be deleted while documents are attached to it. Remove or reassign
                  them in Board Documents first, then try again.
                </p>
                {blocked.titles?.length > 0 && (
                  <ul className="mt-2 space-y-0.5 text-xs text-muted-foreground list-disc pl-4">
                    {blocked.titles.map((t, i) => <li key={i} className="truncate">{t}</li>)}
                  </ul>
                )}
              </div>
            </div>
          </div>
        ) : (
          <>
            <p className="text-sm text-muted-foreground mb-4 break-words">
              Permanently delete "{meetingTitle}"? Its attendance records and action register links will be removed (the registers themselves are kept).
            </p>
            <p className="text-sm text-foreground mb-2">Type <span className="font-bold">{KEYWORD}</span> to confirm.</p>
            <Input value={typed} onChange={e => setTyped(e.target.value)} placeholder={KEYWORD} className="mb-5 text-sm" autoFocus />
          </>
        )}

        <div className="flex items-center justify-end gap-3">
          <Button variant="outline" onClick={onClose}>{blocked ? 'Close' : 'Cancel'}</Button>
          {!blocked && (
            <Button variant="destructive" onClick={handleConfirm} disabled={!confirmed || deleting}>
              {deleting ? 'Working...' : 'Delete'}
            </Button>
          )}
        </div>
      </div>
    </ModalOverlay>
  );
}