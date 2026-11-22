import React from 'react';
import { Check } from 'lucide-react';
import { cn } from '@/lib/utils';

export default function ReportSectionPicker({ sections, selected, onToggle }) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 max-h-72 overflow-y-auto pr-1">
      {sections.map((section) => {
        const checked = selected.includes(section.id);
        return <button key={section.id} type="button" onClick={() => onToggle(section.id)}
          className={cn('flex items-center gap-3 rounded-lg border px-3 py-2.5 text-left transition-colors', checked ? 'border-primary/40 bg-primary/5' : 'border-border hover:bg-muted/40')}>
          <span className={cn('flex h-5 w-5 shrink-0 items-center justify-center rounded border', checked ? 'border-primary bg-primary text-primary-foreground' : 'border-input')}>
            {checked && <Check className="h-3.5 w-3.5" />}
          </span>
          <span className="text-sm font-medium text-foreground">{section.label}</span>
        </button>;
      })}
    </div>
  );
}