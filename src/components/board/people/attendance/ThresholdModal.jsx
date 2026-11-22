import React, { useState, useEffect } from 'react';
import { X } from 'lucide-react';
import ModalOverlay from '@/components/ui/ModalOverlay';
import { Slider } from '@/components/ui/slider';
import { Button } from '@/components/ui/button';
import useUnsavedChanges from '@/hooks/useUnsavedChanges';

const CONFIG = {
  good: {
    title: 'Good Attendance Threshold',
    description: 'Members with an attendance rate above this value are counted as Good Attendance.',
    accent: 'text-green-600',
  },
  atRisk: {
    title: 'At Risk Threshold',
    description: 'Members with an attendance rate below this value are counted as At Risk.',
    accent: 'text-destructive',
  },
};

export default function ThresholdModal({ open, onOpenChange, which, value, onSave, isSaving }) {
  const cfg = CONFIG[which] || CONFIG.good;
  const [local, setLocal] = useState(value ?? 0);

  useEffect(() => {
    if (open) setLocal(value ?? 0);
  }, [open, value]);

  const handleSave = async () => {
    await onSave(local);
    onOpenChange(false);
  };

  const guard = useUnsavedChanges({
    draft: local,
    baseline: value ?? 0,
    onClose: () => onOpenChange(false),
    saving: isSaving,
    enabled: open,
    subject: 'edits',
  });

  return (
    <ModalOverlay isOpen={open} onClose={guard.requestClose}>
      <div className="bg-card w-[28rem] max-w-[92vw] rounded-2xl shadow-xl border border-border p-6">
        <div className="flex items-start justify-between gap-4 mb-1">
          <h2 className="font-bold text-lg">{cfg.title}</h2>
          <button onClick={() => guard.requestClose()} className="text-muted-foreground hover:text-foreground">
            <X className="w-4 h-4" />
          </button>
        </div>
        <p className="text-sm text-muted-foreground">{cfg.description}</p>

        <div className="py-5">
          <div className="flex items-baseline justify-between mb-3">
            <span className="text-sm font-medium text-foreground">Attendance rate</span>
            <span className={`text-2xl font-bold ${cfg.accent}`}>{local}%</span>
          </div>
          <Slider value={[local]} min={0} max={100} step={1} onValueChange={(v) => setLocal(v[0])} />
          <div className="flex justify-between text-xs text-muted-foreground mt-2">
            <span>0%</span>
            <span>100%</span>
          </div>
        </div>

        <div className="flex justify-end gap-2">
          <Button variant="outline" onClick={() => guard.requestClose()} disabled={isSaving}>Cancel</Button>
          <Button onClick={handleSave} disabled={isSaving}>{isSaving ? 'Saving…' : 'Save Threshold'}</Button>
        </div>
      </div>
      {guard.dialog}
    </ModalOverlay>
  );
}