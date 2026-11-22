import React, { useState, useEffect } from 'react';
import MotionModal from '@/components/shared/MotionModal';
import { Button } from '@/components/ui/button';
import CircleSelector from '@/components/shared/export/CircleSelector';
import { FileText, FileSpreadsheet } from 'lucide-react';

const ICONS = {
  pdf: <FileText className="w-5 h-5 text-red-600" />,
  excel: <FileSpreadsheet className="w-5 h-5 text-green-600" />,
};

/**
 * Generic status-scoped export dialog — export all, or pick one/more statuses.
 * onConfirm receives an array of selected status values, or null when "All" is chosen.
 *
 * Props:
 *  - allLabel: label for the "All" option (e.g. "All grants")
 *  - description: helper text under the title
 *  - statusOptions: [{ value, label }]
 *  - variant: 'pdf' | 'excel' — controls title, icon and confirm label (default 'pdf')
 */
export default function ExportPdfStatusDialog({
  isOpen,
  onClose,
  onConfirm,
  allLabel = 'All',
  description,
  statusOptions = [],
  variant = 'pdf',
}) {
  const isExcel = variant === 'excel';
  const title = isExcel ? 'Export to Excel' : 'Export to PDF';
  const confirmLabel = isExcel ? 'Export Excel' : 'Export PDF';
  const helper = description || (isExcel
    ? 'Choose which records to include in the Excel file.'
    : 'Choose which records to include in the PDF.');
  const [all, setAll] = useState(true);
  const [statuses, setStatuses] = useState([]);

  useEffect(() => {
    if (isOpen) { setAll(true); setStatuses([]); }
  }, [isOpen]);

  const toggleStatus = (value) => {
    setAll(false);
    setStatuses((prev) =>
      prev.includes(value) ? prev.filter((s) => s !== value) : [...prev, value]
    );
  };

  const handleAll = () => {
    setAll(true);
    setStatuses([]);
  };

  const canConfirm = all || statuses.length > 0;

  return (
    <MotionModal
      isOpen={isOpen}
      onClose={onClose}
      maxWidth="max-w-md"
      title={<>{ICONS[variant] || ICONS.pdf}{title}</>}
      footer={
        <>
          <Button variant="outline" onClick={onClose}>Cancel</Button>
          <Button
            disabled={!canConfirm}
            onClick={() => onConfirm(all ? null : statuses)}
            className="bg-primary text-white hover:bg-primary/90"
          >
            {confirmLabel}
          </Button>
        </>
      }
    >
        <div className="space-y-2 py-2">
          <p className="text-sm text-muted-foreground">{helper}</p>

          <button
            type="button"
            onClick={handleAll}
            className="flex w-full items-center gap-3 rounded-lg border border-border px-3 py-2.5 text-left cursor-pointer hover:bg-muted/40"
          >
            <CircleSelector checked={all} />
            <span className="text-sm font-medium text-foreground">{allLabel}</span>
          </button>

          <div className="pt-1">
            <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-2">
              Or select by status
            </p>
            <div className="grid grid-cols-2 gap-2">
              {statusOptions.map((o) => (
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