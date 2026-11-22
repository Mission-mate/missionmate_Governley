import React, { useState, useEffect } from 'react';
import MotionModal from '@/components/shared/MotionModal';
import { Button } from '@/components/ui/button';
import CircleSelector from '@/components/shared/export/CircleSelector';
import { FileText, FileSpreadsheet } from 'lucide-react';
import { cn } from '@/lib/utils';

/**
 * Generic export scope dialog: "All <items>", "Selected <items>" (enabled only when
 * rows are selected in the register), or a multi-select list of statuses.
 * options: array of { value, label } (or plain strings).
 * onConfirm('selected') when the selected-rows scope is chosen;
 * onConfirm(null) for all; onConfirm([statuses]) otherwise.
 */
export default function ExportScopeDialog({
  isOpen,
  format = 'pdf',
  itemLabel = 'records',
  allLabel = 'All Records',
  selectedLabel = 'Selected Records',
  selectedCount = 0,
  options = [],
  onClose,
  onConfirm,
}) {
  const [mode, setMode] = useState('all'); // 'all' | 'selected' | 'status'
  const [statuses, setStatuses] = useState([]);

  useEffect(() => { if (isOpen) { setMode('all'); setStatuses([]); } }, [isOpen]);

  const isPdf = format === 'pdf';
  const label = isPdf ? 'PDF' : 'Excel';
  const opts = options.map((o) => (typeof o === 'string' ? { value: o, label: o } : o));

  const toggle = (value) => {
    setMode('status');
    setStatuses((prev) => (prev.includes(value) ? prev.filter((v) => v !== value) : [...prev, value]));
  };

  const handleConfirm = () => {
    if (mode === 'selected') return onConfirm('selected');
    onConfirm(mode === 'status' && statuses.length ? statuses : null);
  };

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
          <Button onClick={handleConfirm} className="bg-primary text-white hover:bg-primary/90">
            Export {label}
          </Button>
        </>
      }
    >
      <div className="space-y-2 py-2">
        <p className="text-sm text-muted-foreground">Choose which {itemLabel} to include in the {label}.</p>

        <div className="grid grid-cols-2 gap-2">
          <button
            type="button"
            onClick={() => { setMode('all'); setStatuses([]); }}
            className="flex items-center gap-2.5 rounded-lg border border-border px-3 py-2.5 text-left cursor-pointer hover:bg-muted/40"
          >
            <CircleSelector checked={mode === 'all'} />
            <span className="text-sm font-medium text-foreground">{allLabel}</span>
          </button>

          <button
            type="button"
            disabled={selectedCount === 0}
            onClick={() => { setMode('selected'); setStatuses([]); }}
            className={cn(
              'flex items-center gap-2.5 rounded-lg border border-border px-3 py-2.5 text-left',
              selectedCount === 0
                ? 'opacity-50 cursor-not-allowed'
                : 'cursor-pointer hover:bg-muted/40'
            )}
          >
            <CircleSelector checked={mode === 'selected'} />
            <span className="text-sm font-medium text-foreground">
              {selectedLabel}{selectedCount > 0 ? ` (${selectedCount})` : ''}
            </span>
          </button>
        </div>

        <div className="pt-1">
          <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-2">
            Or select by status
          </p>
          <div className="grid grid-cols-2 gap-2">
            {opts.map((o) => (
              <button
                type="button"
                key={o.value}
                onClick={() => toggle(o.value)}
                className="flex items-center gap-2.5 rounded-lg border border-border px-3 py-2 text-left cursor-pointer hover:bg-muted/40"
              >
                <CircleSelector checked={mode === 'status' && statuses.includes(o.value)} />
                <span className="text-sm text-foreground">{o.label}</span>
              </button>
            ))}
          </div>
        </div>
      </div>
    </MotionModal>
  );
}