import React, { useState, useEffect } from 'react';
import MotionModal from '@/components/shared/MotionModal';
import { Button } from '@/components/ui/button';
import CircleSelector from '@/components/shared/export/CircleSelector';
import { FileText, FileSpreadsheet } from 'lucide-react';

const ACTION_OPTIONS = [
  { value: 'active', label: 'Open Actions' },
  { value: 'completed', label: 'Closed Actions' },
];

/**
 * Export scope dialog for a register: choose everything or one status.
 * Shared by both PDF and Excel export. Defaults to meeting actions; other
 * registers pass their own noun, "all" label and status options.
 *
 * onConfirm receives the selected scope: 'all' or one option's value.
 */
export default function ExportActionsDialog({
  isOpen, format = 'pdf', onClose, onConfirm,
  noun = 'actions', allLabel = 'All Actions', options = ACTION_OPTIONS,
}) {
  const [scope, setScope] = useState('all');

  useEffect(() => {
    if (isOpen) setScope('all');
  }, [isOpen]);

  const isPdf = format === 'pdf';
  const label = isPdf ? 'PDF' : 'Excel';

  return (
    <MotionModal
      isOpen={isOpen}
      onClose={onClose}
      maxWidth="max-w-md"
      title={
        <>
          {isPdf
            ? <FileText className="w-5 h-5 text-red-600" />
            : <FileSpreadsheet className="w-5 h-5 text-green-600" />}
          Export to {label}
        </>
      }
      footer={
        <>
          <Button variant="outline" onClick={onClose}>Cancel</Button>
          <Button onClick={() => onConfirm(scope)} className="bg-primary text-white hover:bg-primary/90">Export {label}</Button>
        </>
      }
    >
        <div className="space-y-2 py-2">
          <p className="text-sm text-muted-foreground">Choose which {noun} to include in the {label}.</p>

          <button
            type="button"
            onClick={() => setScope('all')}
            className="flex w-full items-center gap-3 rounded-lg border border-border px-3 py-2.5 text-left cursor-pointer hover:bg-muted/40"
          >
            <CircleSelector checked={scope === 'all'} />
            <span className="text-sm font-medium text-foreground">{allLabel}</span>
          </button>

          <div className="pt-1">
            <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-2">
              Or select by status
            </p>
            <div className="grid grid-cols-2 gap-2">
              {options.map((o) => (
                <button
                  type="button"
                  key={o.value}
                  onClick={() => setScope(o.value)}
                  className="flex items-center gap-2.5 rounded-lg border border-border px-3 py-2 text-left cursor-pointer hover:bg-muted/40"
                >
                  <CircleSelector checked={scope === o.value} />
                  <span className="text-sm text-foreground">{o.label}</span>
                </button>
              ))}
            </div>
          </div>
        </div>
    </MotionModal>
  );
}