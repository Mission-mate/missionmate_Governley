import React, { useState } from 'react';
import { Lock, LockOpen } from 'lucide-react';
import { Button } from '@/components/ui/button';
import IconTip from '@/components/shared/IconTip';
import { cn } from '@/lib/utils';
import PinBoxes from './PinBoxes';

/**
 * Meeting Access Code — UI placeholder only (no persistence or enforcement).
 * `placeholder` (Add mode) shows empty boxes with an inactive lock control.
 * Otherwise starts locked and masked; unlocking reveals and allows editing,
 * and Save Changes / Cancel apply only to this pane's local state.
 */
export default function MeetingAccessCode({ placeholder = false }) {
  const [saved, setSaved] = useState('');
  const [draft, setDraft] = useState('');
  const [unlocked, setUnlocked] = useState(false);
  const dirty = draft !== saved;
  const complete = /^\d{4}$/.test(draft);

  const toggleLock = () => {
    if (unlocked) setDraft(saved);
    setUnlocked((u) => !u);
  };

  const tip = placeholder
    ? 'The access code can be set once the committee is created'
    : unlocked ? 'Lock and hide the access code' : 'Unlock to view and edit the access code';

  return (
    <div className="rounded-2xl bg-muted p-5 space-y-4">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-sm font-semibold text-foreground">Meeting Access Code</p>
          <p className="text-xs text-muted-foreground mt-0.5">Configure a PIN required to access committee meetings</p>
        </div>
        <IconTip label={tip}>
          <span className="shrink-0">
            <button
              type="button"
              onClick={toggleLock}
              disabled={placeholder}
              aria-label={tip}
              className={cn(
                'h-8 w-8 inline-flex items-center justify-center rounded-lg border border-border bg-card text-muted-foreground',
                'transition-all duration-200 hover:-translate-y-0.5 hover:shadow-md hover:text-primary hover:border-primary/40',
                'disabled:opacity-60 disabled:cursor-not-allowed disabled:hover:translate-y-0 disabled:hover:shadow-none disabled:hover:text-muted-foreground disabled:hover:border-border',
                unlocked && 'text-primary border-primary/40',
              )}
            >
              {unlocked ? <LockOpen className="h-4 w-4" /> : <Lock className="h-4 w-4" />}
            </button>
          </span>
        </IconTip>
      </div>

      <PinBoxes value={placeholder ? '' : draft} onChange={setDraft} disabled={placeholder || !unlocked} masked={!unlocked} />

      {!placeholder && !unlocked && !saved && <p className="text-xs text-muted-foreground/80">No access code set</p>}

      {unlocked && dirty && (
        <div className="flex justify-end gap-2 animate-expand-enter">
          <Button type="button" size="sm" variant="outline" onClick={() => setDraft(saved)}>Cancel</Button>
          <Button type="button" size="sm" disabled={!complete} onClick={() => setSaved(draft)}>Save Changes</Button>
        </div>
      )}
    </div>
  );
}