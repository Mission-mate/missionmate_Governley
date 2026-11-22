import React, { useEffect, useState } from 'react';
import { FileText, FileSpreadsheet, Check } from 'lucide-react';
import { Button } from '@/components/ui/button';
import MotionModal from '@/components/shared/MotionModal';
import { cn } from '@/lib/utils';

function ScopeOption({ active, disabled, onClick, children }) {
  return (
    <button
      type="button"
      disabled={disabled}
      onClick={onClick}
      className={cn(
        'flex items-center gap-3 px-4 py-3 rounded-xl border text-left transition-colors disabled:opacity-50 disabled:cursor-not-allowed',
        active ? 'border-primary bg-primary/5' : 'border-border hover:bg-muted/40'
      )}
    >
      <span className={cn(
        'w-5 h-5 rounded-full flex items-center justify-center shrink-0 border',
        active ? 'bg-primary border-primary' : 'border-muted-foreground/40'
      )}>
        {active && <Check className="w-3 h-3 text-primary-foreground" />}
      </span>
      <span className="text-sm font-medium text-foreground">{children}</span>
    </button>
  );
}

/**
 * Export scope picker for the Conflict of Interest register.
 * type: 'pdf' | 'excel'
 * selectedCount: number shows the "Selected" option (Compliance register); null hides it.
 * onConfirm(scope) — scope is 'all' | 'selected' | 'Open' | 'Closed'
 */
export default function ExportConflictModal({ isOpen, type, selectedCount = null, onConfirm, onClose }) {
  const [scope, setScope] = useState('all');
  const [busy, setBusy] = useState(false);
  const showSelected = selectedCount !== null;

  useEffect(() => { if (isOpen) setScope('all'); }, [isOpen]);

  const isPdf = type === 'pdf';
  const label = isPdf ? 'PDF' : 'Excel';
  const Icon = isPdf ? FileText : FileSpreadsheet;
  const iconColor = isPdf ? 'text-red-600' : 'text-green-600';

  const handleConfirm = async () => {
    if (busy) return;
    setBusy(true);
    try {
      await onConfirm(scope);
      onClose();
    } finally {
      setBusy(false);
    }
  };

  return (
    <MotionModal
      isOpen={isOpen}
      onClose={onClose}
      maxWidth="max-w-md"
      title={<><Icon className={cn('w-5 h-5', iconColor)} /> Export to {label}</>}
      footer={
        <>
          <Button variant="outline" onClick={onClose}>Cancel</Button>
          <Button onClick={handleConfirm} disabled={busy}>
            {busy ? 'Preparing…' : `Export ${label}`}
          </Button>
        </>
      }
    >
      <div className="space-y-4">
        <p className="text-sm text-muted-foreground">Choose which conflicts to include in the {label}.</p>
        <div className={cn('grid gap-3', showSelected ? 'grid-cols-2' : 'grid-cols-1')}>
          <ScopeOption active={scope === 'all'} onClick={() => setScope('all')}>
            {showSelected ? 'All' : 'All Conflicts of Interest'}
          </ScopeOption>
          {showSelected && (
            <ScopeOption active={scope === 'selected'} disabled={!selectedCount} onClick={() => setScope('selected')}>
              Selected ({selectedCount})
            </ScopeOption>
          )}
        </div>
        <div>
          <p className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider mb-2">Or select by status</p>
          <div className="grid grid-cols-2 gap-3">
            <ScopeOption active={scope === 'Open'} onClick={() => setScope('Open')}>Open</ScopeOption>
            <ScopeOption active={scope === 'Closed'} onClick={() => setScope('Closed')}>Closed</ScopeOption>
          </div>
        </div>
      </div>
    </MotionModal>
  );
}