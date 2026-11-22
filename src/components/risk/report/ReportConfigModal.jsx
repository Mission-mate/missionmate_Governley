import React, { useEffect, useState } from 'react';
import MotionModal from '@/components/shared/MotionModal';
import { Button } from '@/components/ui/button';
import { defaultSections, sectionsForType } from '@/lib/riskReportSections';
import ReportPresetPicker from './ReportPresetPicker';
import ReportSectionPicker from './ReportSectionPicker';

export default function ReportConfigModal({ open, onOpenChange, reportType, initialConfig, onGenerate }) {
  const [length, setLength] = useState('detailed');
  const [selected, setSelected] = useState([]);
  useEffect(() => {
    if (!open) return;
    const nextLength = initialConfig?.length || 'detailed';
    setLength(nextLength);
    setSelected(initialConfig?.sections || defaultSections(reportType.id, nextLength));
  }, [open, reportType.id, initialConfig]);
  const chooseLength = (next) => { setLength(next); setSelected(defaultSections(reportType.id, next)); };
  const toggle = (id) => setSelected((current) => current.includes(id) ? current.filter((item) => item !== id) : [...current, id]);
  return (
    <MotionModal
      isOpen={open}
      onClose={() => onOpenChange(false)}
      maxWidth="max-w-2xl"
      title={`Configure ${reportType.short} report`}
      footer={
        <>
          <Button variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
          <Button disabled={!selected.length} onClick={() => onGenerate({ length, sections: selected })}>Generate report</Button>
        </>
      }
    >
        <div className="space-y-5 py-2">
          <p className="text-sm text-muted-foreground">Choose a length preset, then tailor the sections included.</p>
          <div><p className="text-sm font-semibold mb-2">Report length</p><ReportPresetPicker value={length} onChange={chooseLength} /></div>
          <div><div className="flex items-center justify-between mb-2"><p className="text-sm font-semibold">Report sections</p><span className="text-xs text-muted-foreground">{selected.length} selected</span></div><ReportSectionPicker sections={sectionsForType(reportType.id)} selected={selected} onToggle={toggle} /></div>
        </div>
    </MotionModal>
  );
}