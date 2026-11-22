import React from 'react';
import { cn } from '@/lib/utils';
import { PERIOD_FINANCIAL, PERIOD_CALENDAR } from '@/lib/financialYear';

const TABS = [
  { value: PERIOD_FINANCIAL, label: 'Financial Year' },
  { value: PERIOD_CALENDAR, label: 'Calendar Year' },
];

/** Two full-width tab buttons for choosing the reporting year type. */
export default function ReportingYearTabs({ value, onChange }) {
  return (
    <div className="flex w-full gap-2">
      {TABS.map((t) => (
        <button
          key={t.value}
          type="button"
          onClick={() => onChange(t.value)}
          className={cn(
            'flex-1 h-9 rounded-md border text-sm font-medium transition-colors',
            value === t.value
              ? 'border-primary bg-primary/10 text-primary'
              : 'border-input bg-transparent text-muted-foreground hover:text-foreground hover:bg-muted/40'
          )}
        >
          {t.label}
        </button>
      ))}
    </div>
  );
}