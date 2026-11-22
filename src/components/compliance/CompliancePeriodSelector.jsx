import React from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import {
  FY_MIN_START, FY_MAX_START, clampStartYear, formatPeriod,
} from '@/lib/financialYear';

/**
 * Compliance period stepper — shows the selected period range for the given
 * Reporting Year type ("1 July 202X - 30 June 202X" or "1 January 202X - 31 December 202X")
 * with previous/next arrows stepping whole years.
 *
 * value: period start year (number). onChange: (startYear) => void.
 */
export default function CompliancePeriodSelector({ value, periodType, onChange }) {
  const startYear = clampStartYear(value ?? FY_MIN_START);
  const canPrev = startYear > FY_MIN_START;
  const canNext = startYear < FY_MAX_START;

  return (
    <div className="flex items-center gap-2">
      <button
        type="button"
        onClick={() => canPrev && onChange(startYear - 1)}
        disabled={!canPrev}
        className="h-9 w-9 shrink-0 flex items-center justify-center rounded-md border border-input text-muted-foreground hover:bg-accent hover:text-foreground transition-colors disabled:opacity-40 disabled:pointer-events-none"
        aria-label="Previous period"
      >
        <ChevronLeft className="w-4 h-4" />
      </button>

      <div className="flex-1 h-9 flex items-center justify-center rounded-md border border-input bg-transparent px-3 text-sm font-medium text-foreground">
        {formatPeriod(periodType, startYear)}
      </div>

      <button
        type="button"
        onClick={() => canNext && onChange(startYear + 1)}
        disabled={!canNext}
        className="h-9 w-9 shrink-0 flex items-center justify-center rounded-md border border-input text-muted-foreground hover:bg-accent hover:text-foreground transition-colors disabled:opacity-40 disabled:pointer-events-none"
        aria-label="Next period"
      >
        <ChevronRight className="w-4 h-4" />
      </button>
    </div>
  );
}