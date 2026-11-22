import React, { useState, useEffect } from 'react';
import MotionModal from '@/components/shared/MotionModal';
import { Button } from '@/components/ui/button';
import CircleSelector from '@/components/shared/export/CircleSelector';
import { FileText, FileSpreadsheet } from 'lucide-react';

const STATUS_OPTIONS = ['All', 'Not Started', 'In Progress', 'Completed', 'On Hold', 'Cancelled'];
const HEALTH_OPTIONS = ['All', 'On Track', 'At Risk', 'Off Track'];

const OptionButton = ({ label, checked, onClick }) => (
  <button
    type="button"
    onClick={onClick}
    className="flex items-center gap-2.5 rounded-lg border border-border px-3 py-2 text-left cursor-pointer hover:bg-muted/40"
  >
    <CircleSelector checked={checked} />
    <span className="text-sm text-foreground">{label}</span>
  </button>
);

/** Export scope dialog for the Strategy Overview tree — status + health filters. */
export default function ExportStrategyOverviewDialog({ isOpen, format = 'pdf', onClose, onConfirm }) {
  const [status, setStatus] = useState('All');
  const [health, setHealth] = useState('All');

  useEffect(() => {
    if (isOpen) { setStatus('All'); setHealth('All'); }
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
          <Button onClick={() => onConfirm(status, health)} className="bg-primary text-white hover:bg-primary/90">
            Export {label}
          </Button>
        </>
      }
    >
      <div className="space-y-4 py-2">
        <p className="text-sm text-muted-foreground">Choose which strategic items to include in the {label}.</p>

        <div>
          <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-2">Select by Status</p>
          <div className="grid grid-cols-2 gap-2">
            {STATUS_OPTIONS.map((s) => (
              <OptionButton key={s} label={s} checked={status === s} onClick={() => setStatus(s)} />
            ))}
          </div>
        </div>

        <div>
          <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-2">Select by Health</p>
          <div className="grid grid-cols-2 gap-2">
            {HEALTH_OPTIONS.map((h) => (
              <OptionButton key={h} label={h} checked={health === h} onClick={() => setHealth(h)} />
            ))}
          </div>
        </div>
      </div>
    </MotionModal>
  );
}