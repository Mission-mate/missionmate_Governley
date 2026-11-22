import React, { useState, useEffect } from 'react';
import MotionModal from '@/components/shared/MotionModal';
import { Button } from '@/components/ui/button';
import CircleSelector from '@/components/shared/export/CircleSelector';
import { FileText, FileSpreadsheet } from 'lucide-react';
import { cn } from '@/lib/utils';

/** Export scope dialog for membership submissions — All or Selected only. */
export default function ExportSubmissionsDialog({ isOpen, format = 'pdf', selectedCount = 0, onClose, onConfirm }) {
  const [scope, setScope] = useState('all');

  useEffect(() => { if (isOpen) setScope('all'); }, [isOpen]);

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
        <p className="text-sm text-muted-foreground">Choose which submissions to include in the {label}.</p>
        <div className="grid grid-cols-2 gap-2">
          <button
            type="button"
            onClick={() => setScope('all')}
            className="flex items-center gap-2.5 rounded-lg border border-border px-3 py-2.5 text-left cursor-pointer hover:bg-muted/40"
          >
            <CircleSelector checked={scope === 'all'} />
            <span className="text-sm font-medium text-foreground">All Submissions</span>
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
      </div>
    </MotionModal>
  );
}