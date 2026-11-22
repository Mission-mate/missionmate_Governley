import React from 'react';
import { ELEVATED_SECTION } from '@/components/shared/cardStyles';

export default function RiskRatingCard() {
  return (
    <div className={ELEVATED_SECTION}>
      <h3 className="text-base font-semibold text-foreground">Risk Rating Description</h3>
      <p className="text-xs text-primary/70 mt-0.5 mb-4 [font-family:'Inter',_ui-sans-serif,_system-ui,_sans-serif] font-bold">How risks are scored and prioritised</p>
      <p className="text-sm text-muted-foreground leading-relaxed">
        The overall Risk Rating is calculated by multiplying the{' '}
        <span className="font-semibold text-foreground">Likelihood</span> score by the{' '}
        <span className="font-semibold text-foreground">Consequence (Impact)</span> score. This
        provides a standardised way to compare and prioritise different types of risk across the
        organisation.
      </p>

      <div className="mt-5 rounded-2xl bg-muted/60 p-5">
        <p className="text-[10px] font-semibold tracking-wider text-muted-foreground/70 mb-3">
          RISK SCORE FORMULA
        </p>
        <div className="flex flex-wrap items-center gap-3">
          <div className="rounded-xl bg-card px-4 py-2.5 shadow-[0_1px_2px_rgba(16,24,40,0.05)]">
            <p className="text-[10px] font-semibold tracking-wider text-muted-foreground/70">LIKELIHOOD</p>
            <p className="text-sm text-foreground">How probable</p>
          </div>
          <span className="text-sm text-muted-foreground">×</span>
          <div className="rounded-xl bg-card px-4 py-2.5 shadow-[0_1px_2px_rgba(16,24,40,0.05)]">
            <p className="text-[10px] font-semibold tracking-wider text-muted-foreground/70">IMPACT</p>
            <p className="text-sm text-foreground">How severe</p>
          </div>
          <span className="text-sm text-muted-foreground">=</span>
          <div className="rounded-xl bg-primary px-4 py-2.5">
            <p className="text-[10px] font-semibold tracking-wider text-primary-foreground/70">RISK SCORE</p>
            <p className="text-sm font-semibold text-primary-foreground">Rating band</p>
          </div>
        </div>
      </div>
    </div>);

}