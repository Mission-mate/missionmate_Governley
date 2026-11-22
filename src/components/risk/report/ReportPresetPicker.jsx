import React from 'react';
import { LENGTH_PRESETS } from '@/lib/riskReportSections';
import { cn } from '@/lib/utils';

export default function ReportPresetPicker({ value, onChange }) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
      {Object.entries(LENGTH_PRESETS).map(([id, preset]) => (
        <button key={id} type="button" onClick={() => onChange(id)}
          className={cn('rounded-xl border p-3 text-left transition-colors', value === id ? 'border-primary bg-primary/5' : 'border-border bg-card hover:bg-muted/40')}>
          <p className="text-sm font-semibold text-foreground">{preset.label}</p>
          <p className="text-xs text-muted-foreground mt-1">{preset.description}</p>
        </button>
      ))}
    </div>
  );
}