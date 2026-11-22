import React, { useEffect, useState } from 'react';
import MotionModal from '@/components/shared/MotionModal';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import ReportSectionPicker from '@/components/risk/report/ReportSectionPicker';
import { LENGTH_PRESETS, REPORT_SECTIONS, defaultSections } from '@/lib/strategy/statusReportSections';

/** Section + length picker for the AI Strategy Status Report. */
export default function StrategyReportConfigModal({ open, onOpenChange, onGenerate }) {
  const [length, setLength] = useState('standard');
  const [selected, setSelected] = useState(defaultSections('standard'));

  useEffect(() => {
    if (!open) return;
    setLength('standard');
    setSelected(defaultSections('standard'));
  }, [open]);

  const chooseLength = (next) => { setLength(next); setSelected(defaultSections(next)); };
  const toggle = (id) =>
    setSelected((current) => (current.includes(id) ? current.filter((item) => item !== id) : [...current, id]));

  return (
    <MotionModal
      isOpen={open}
      onClose={() => onOpenChange(false)}
      maxWidth="max-w-2xl"
      title="Generate Strategy Status Report"
      footer={
        <>
          <Button variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
          <Button disabled={!selected.length} onClick={() => onGenerate({ length, sections: selected })}>
            Generate report
          </Button>
        </>
      }
    >
        <div className="space-y-5 py-2">
          <p className="text-sm text-muted-foreground">
            All figures are calculated from your strategy data. Choose a length, then tailor the sections included.
          </p>
          <div>
            <p className="text-sm font-semibold mb-2">Report length</p>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
              {Object.entries(LENGTH_PRESETS).map(([id, preset]) => (
                <button
                  key={id}
                  type="button"
                  onClick={() => chooseLength(id)}
                  className={cn(
                    'rounded-xl border p-3 text-left transition-colors',
                    length === id ? 'border-primary bg-primary/5' : 'border-border bg-card hover:bg-muted/40'
                  )}
                >
                  <p className="text-sm font-semibold text-foreground">{preset.label}</p>
                  <p className="text-xs text-muted-foreground mt-1">{preset.description}</p>
                </button>
              ))}
            </div>
          </div>

          <div>
            <div className="flex items-center justify-between mb-2">
              <p className="text-sm font-semibold">Report sections</p>
              <div className="flex items-center gap-3">
                <span className="text-xs text-muted-foreground">{selected.length} selected</span>
                <button
                  type="button"
                  className="text-xs font-medium text-primary hover:underline"
                  onClick={() => setSelected(REPORT_SECTIONS.map((s) => s.id))}
                >
                  Select all
                </button>
              </div>
            </div>
            <ReportSectionPicker sections={REPORT_SECTIONS} selected={selected} onToggle={toggle} />
          </div>
        </div>
    </MotionModal>
  );
}