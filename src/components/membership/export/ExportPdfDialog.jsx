import React, { useState, useEffect } from 'react';
import MotionModal from '@/components/shared/MotionModal';
import { Button } from '@/components/ui/button';
import CircleSelector from '@/components/shared/export/CircleSelector';
import { FileText, FileSpreadsheet } from 'lucide-react';

const VARIANTS = {
  pdf: { title: 'Export to PDF', icon: FileText, iconClass: 'text-red-600', desc: 'Choose which members to include in the PDF.', confirm: 'Export PDF' },
  excel: { title: 'Export to Excel', icon: FileSpreadsheet, iconClass: 'text-green-600', desc: 'Choose which members to include in the Excel file.', confirm: 'Export Excel' },
};

const STATUS_OPTIONS = [
  { value: 'active', label: 'Active' },
  { value: 'expired', label: 'Expired' },
  { value: 'pending', label: 'Pending' },
  { value: 'archived', label: 'Archived' },
];

/**
 * PDF export dialog — lets the user export all members, or pick one/more statuses.
 * onConfirm receives an array of selected statuses, or null when "All" is chosen.
 */
export default function ExportPdfDialog({ isOpen, onClose, onConfirm, variant = 'pdf', selectedCount = 0 }) {
  const cfg = VARIANTS[variant] || VARIANTS.pdf;
  const Icon = cfg.icon;
  // scope: 'all' | 'selected' | 'status'
  const [scope, setScope] = useState('all');
  const [statuses, setStatuses] = useState([]);

  useEffect(() => {
    if (isOpen) { setScope('all'); setStatuses([]); }
  }, [isOpen]);

  const all = scope === 'all';

  const toggleStatus = (value) => {
    setScope('status');
    setStatuses((prev) =>
      prev.includes(value) ? prev.filter((s) => s !== value) : [...prev, value]
    );
  };

  const handleAll = () => {
    setScope('all');
    setStatuses([]);
  };

  const handleSelected = () => {
    setScope('selected');
    setStatuses([]);
  };

  const canConfirm = all || scope === 'selected' || statuses.length > 0;

  return (
    <MotionModal
      isOpen={isOpen}
      onClose={onClose}
      maxWidth="max-w-md"
      title={<><Icon className={`w-5 h-5 ${cfg.iconClass}`} />{cfg.title}</>}
      footer={
        <>
          <Button variant="outline" onClick={onClose}>Cancel</Button>
          <Button
            disabled={!canConfirm}
            onClick={() => onConfirm(all ? null : scope === 'selected' ? 'selected' : statuses)}
            className="bg-primary text-white hover:bg-primary/90"
          >
            {cfg.confirm}
          </Button>
        </>
      }
    >
        <div className="space-y-2 py-2">
          <p className="text-sm text-muted-foreground">
            {cfg.desc}
          </p>

          <div className="grid grid-cols-2 gap-2">
            <button
              type="button"
              onClick={handleAll}
              className="flex items-center gap-3 rounded-lg border border-border px-3 py-2.5 text-left cursor-pointer hover:bg-muted/40"
            >
              <CircleSelector checked={all} />
              <span className="text-sm font-medium text-foreground">All members</span>
            </button>

            <button
              type="button"
              onClick={handleSelected}
              disabled={selectedCount === 0}
              className="flex items-center gap-3 rounded-lg border border-border px-3 py-2.5 text-left cursor-pointer hover:bg-muted/40 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <CircleSelector checked={scope === 'selected'} />
              <span className="text-sm font-medium text-foreground truncate">
                Selected{selectedCount > 0 ? ` (${selectedCount})` : ''}
              </span>
            </button>
          </div>

          <div className="pt-1">
            <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-2">
              Or select by status
            </p>
            <div className="grid grid-cols-2 gap-2">
              {STATUS_OPTIONS.map((o) => (
                <button
                  type="button"
                  key={o.value}
                  onClick={() => toggleStatus(o.value)}
                  className="flex items-center gap-2.5 rounded-lg border border-border px-3 py-2 text-left cursor-pointer hover:bg-muted/40"
                >
                  <CircleSelector checked={!all && statuses.includes(o.value)} />
                  <span className="text-sm text-foreground">{o.label}</span>
                </button>
              ))}
            </div>
          </div>
        </div>
    </MotionModal>
  );
}