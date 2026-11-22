import React, { useState, useEffect } from 'react';
import MotionModal from '@/components/shared/MotionModal';
import { Button } from '@/components/ui/button';
import CircleSelector from '@/components/shared/export/CircleSelector';
import { FileText, FileSpreadsheet } from 'lucide-react';
import { cn } from '@/lib/utils';

const STATUS_OPTIONS = ['Not Started', 'In Progress', 'Completed', 'On Hold', 'Cancelled'];

/**
 * Export scope dialog for work items.
 * onConfirm receives the selected scope: 'all', 'selected', or a status name.
 */
export default function ExportWorkItemsDialog({ isOpen, format = 'pdf', selectedCount = 0, onClose, onConfirm }) {
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
        <p className="text-sm text-muted-foreground">Choose which work items to include in the {label}.</p>

        <div className="grid grid-cols-2 gap-2">
          <button
            type="button"
            onClick={() => setScope('all')}
            className="flex items-center gap-2.5 rounded-lg border border-border px-3 py-2.5 text-left cursor-pointer hover:bg-muted/40"
          >
            <CircleSelector checked={scope === 'all'} />
            <span className="text-sm font-medium text-foreground">All</span>
          </button>
          <button
            type="button"
            disabled={selectedCount === 0}
            onClick={() => setScope('selected')}
            className={cn(
              'flex items-center gap-2.5 rounded-lg border border-border px-3 py-2.5 text-left',
              selectedCount === 0 ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer hover:bg-muted/40'
            )}
          >
            <CircleSelector checked={scope === 'selected'} />
            <span className="text-sm font-medium text-foreground">
              Selected{selectedCount > 0 ? ` (${selectedCount})` : ''}
            </span>
          </button>
        </div>

        <div className="pt-1">
          <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-2">
            Or select by status
          </p>
          <div className="grid grid-cols-2 gap-2">
            {STATUS_OPTIONS.map((s) => (
              <button
                type="button"
                key={s}
                onClick={() => setScope(s)}
                className="flex items-center gap-2.5 rounded-lg border border-border px-3 py-2 text-left cursor-pointer hover:bg-muted/40"
              >
                <CircleSelector checked={scope === s} />
                <span className="text-sm text-foreground">{s}</span>
              </button>
            ))}
          </div>
        </div>
      </div>
    </MotionModal>
  );
}