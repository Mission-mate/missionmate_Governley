import React, { useState, useEffect } from 'react';
import MotionModal from '@/components/shared/MotionModal';
import { Button } from '@/components/ui/button';
import CircleSelector from '@/components/shared/export/CircleSelector';
import SectionLoader from '@/components/shared/states/SectionLoader';
import { FileText, FileSpreadsheet } from 'lucide-react';

const ICONS = {
  pdf: <FileText className="w-5 h-5 text-red-600" />,
  excel: <FileSpreadsheet className="w-5 h-5 text-green-600" />,
};

/**
 * Contacts export dialog — export all, or pick one saved Smart Group.
 * onConfirm receives the selected smart list object, or null when "All" is chosen.
 *
 * Props:
 *  - variant: 'pdf' | 'excel'
 *  - smartLists: [{ id, name, filters }]
 */
export default function ExportContactsDialog({
  isOpen,
  onClose,
  onConfirm,
  smartLists = [],
  smartListsLoading = false,
  selectedCount = 0,
  variant = 'pdf',
}) {
  // scope: 'all' | 'selected' | 'group'
  const [scope, setScope] = useState('all');
  const [groupId, setGroupId] = useState(null);

  useEffect(() => {
    if (isOpen) { setScope('all'); setGroupId(null); }
  }, [isOpen]);

  const isExcel = variant === 'excel';
  const title = isExcel ? 'Export to Excel' : 'Export to PDF';
  const confirmLabel = isExcel ? 'Export Excel' : 'Export PDF';
  const helper = isExcel
    ? 'Choose which contacts to include in the Excel file.'
    : 'Choose which contacts to include in the PDF.';

  const selectGroup = (id) => { setScope('group'); setGroupId(id); };
  const handleAll = () => { setScope('all'); setGroupId(null); };
  const handleSelected = () => { setScope('selected'); setGroupId(null); };

  const canConfirm = scope === 'all' || scope === 'selected' || (scope === 'group' && !!groupId);

  const handleConfirm = () => {
    if (scope === 'all') return onConfirm({ scope: 'all' });
    if (scope === 'selected') return onConfirm({ scope: 'selected' });
    onConfirm({ scope: 'group', group: smartLists.find((l) => l.id === groupId) || null });
  };

  return (
    <MotionModal
      isOpen={isOpen}
      onClose={onClose}
      maxWidth="max-w-md"
      title={<>{ICONS[variant] || ICONS.pdf}{title}</>}
      footer={
        <>
          <Button variant="outline" onClick={onClose}>Cancel</Button>
          <Button disabled={!canConfirm} onClick={handleConfirm} className="bg-primary text-white hover:bg-primary/90">
            {confirmLabel}
          </Button>
        </>
      }
    >
        <div className="space-y-2 py-2">
          <p className="text-sm text-muted-foreground">{helper}</p>

          <div className="grid grid-cols-2 gap-2">
            <button
              type="button"
              onClick={handleAll}
              className="flex items-center gap-3 rounded-lg border border-border px-3 py-2.5 text-left cursor-pointer hover:bg-muted/40"
            >
              <CircleSelector checked={scope === 'all'} />
              <span className="text-sm font-medium text-foreground">All contacts</span>
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
              Or select by group
            </p>
            {smartListsLoading ? (
              <SectionLoader />
            ) : smartLists.length === 0 ? (
              <p className="text-sm text-muted-foreground px-1 py-2">
                No smart groups saved yet.
              </p>
            ) : (
              <div className="grid grid-cols-2 gap-2 max-h-56 overflow-y-auto">
                {smartLists.map((l) => (
                  <button
                    type="button"
                    key={l.id}
                    onClick={() => selectGroup(l.id)}
                    className="flex items-center gap-2.5 rounded-lg border border-border px-3 py-2 text-left cursor-pointer hover:bg-muted/40"
                  >
                    <CircleSelector checked={scope === 'group' && groupId === l.id} />
                    <span className="text-sm text-foreground truncate">{l.name}</span>
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>
    </MotionModal>
  );
}