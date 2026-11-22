import React from 'react';
import { cn } from '@/lib/utils';
import { TREATMENT_STYLES } from '@/components/risk/steps/treatmentConstants';

/**
 * Coloured label for a risk treatment strategy — matches the Risk Appetite
 * label styling (font size, weight and vertical height).
 */
export default function TreatmentBadge({ value, className }) {
  if (!value) return <span className="text-muted-foreground/50">—</span>;
  return (
    <span className={cn(
      'inline-block text-xs px-2 py-0.5 rounded-full font-medium whitespace-nowrap',
      TREATMENT_STYLES[value] || 'bg-muted text-muted-foreground',
      className
    )}>
      {value}
    </span>
  );
}