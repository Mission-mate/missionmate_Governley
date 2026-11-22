import React, { useState, useEffect } from 'react';
import MotionModal from '@/components/shared/MotionModal';
import { Button } from '@/components/ui/button';
import CircleSelector from '@/components/shared/export/CircleSelector';
import { FileText, FileSpreadsheet } from 'lucide-react';
import { cn } from '@/lib/utils';

const STATUS_OPTIONS = ['Not Started', 'In Progress', 'Completed', 'On Hold', 'Cancelled'];
const HEALTH_OPTIONS = ['On Track', 'At Risk', 'Off Track'];

const CARD = 'flex items-center gap-2.5 rounded-lg border border-border px-3 py-2 text-left w-full';

const ScopeCard = ({ label, checked, disabled, onClick }) => (
  <button
    type="button"
    disabled={disabled}
    onClick={onClick}
    className={cn(CARD, disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer hover:bg-muted/40')}
  >
    <CircleSelector checked={checked} />
    <span className="text-sm text-foreground">{label}</span>
  </button>
);

const CheckCard = ({ label, checked, onClick }) => (
  <button type="button" onClick={onClick} className={cn(CARD, 'cursor-pointer hover:bg-muted/40')}>
    <CircleSelector checked={checked} />
    <span className="text-sm text-foreground">{label}</span>
  </button>
);

const SectionLabel = ({ children }) => (
  <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-2">{children}</p>
);

/**
 * Export scope dialog for the strategy level tables — row scope (All / Selected)
 * plus multi-select status and health filters.
 */
export default function ExportStrategyLevelDialog({
  isOpen,
  format = 'pdf',
  selectedIds,
  hasStatus = true,
  onClose,
  onConfirm,
}) {
  const [scope, setScope] = useState('all');
  const [statuses, setStatuses] = useState([]);
  const [healths, setHealths] = useState([]);
  const hasSelection = !!selectedIds && selectedIds.size > 0;

  useEffect(() => {
    if (isOpen) { setScope('all'); setStatuses([]); setHealths([]); }
  }, [isOpen]);

  const toggle = (list, setList, value, resetScope) => {
    const next = list.includes(value) ? list.filter((v) => v !== value) : [...list, value];
    setList(next);
    if (resetScope && next.length) setScope('all');
  };

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
          <Button
            onClick={() => onConfirm(scope === 'selected' ? selectedIds : null, statuses, healths)}
            className="bg-primary text-white hover:bg-primary/90"
          >
            Export {label}
          </Button>
        </>
      }
    >
      <div className="space-y-4 py-2">
        <p className="text-sm text-muted-foreground">Choose which records to include in the {label}.</p>

        <div>
          <SectionLabel>Rows to Export</SectionLabel>
          <div className="grid grid-cols-2 gap-2">
            <ScopeCard label="All" checked={scope === 'all'} onClick={() => setScope('all')} />
            <ScopeCard
              label="Selected"
              checked={scope === 'selected'}
              disabled={!hasSelection}
              onClick={() => { setScope('selected'); setStatuses([]); setHealths([]); }}
            />
          </div>
        </div>

        {hasStatus && (
          <div>
            <SectionLabel>Or Select by Status</SectionLabel>
            <div className="grid grid-cols-2 gap-2">
              {STATUS_OPTIONS.map((s) => (
                <CheckCard
                  key={s}
                  label={s}
                  checked={statuses.includes(s)}
                  onClick={() => toggle(statuses, setStatuses, s, true)}
                />
              ))}
            </div>
          </div>
        )}

        <div>
          <SectionLabel>Or Select by Health</SectionLabel>
          <div className="grid grid-cols-2 gap-2">
            {HEALTH_OPTIONS.map((h) => (
              <CheckCard
                key={h}
                label={h}
                checked={healths.includes(h)}
                onClick={() => toggle(healths, setHealths, h, true)}
              />
            ))}
          </div>
        </div>
      </div>
    </MotionModal>
  );
}