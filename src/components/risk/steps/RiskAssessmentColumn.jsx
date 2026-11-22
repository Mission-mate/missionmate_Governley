import React from 'react';
import { Label } from '@/components/ui/label';
import { cn } from '@/lib/utils';
import InfoTooltip from '@/components/risk/InfoTooltip';
import {
  LIKELIHOOD_OPTIONS,
  CONSEQUENCE_OPTIONS,
  getRiskRating,
  getRiskScore,
  RATING_STYLES,
  LEVEL_TONES,
  levelName } from
'@/lib/riskMatrix';
import ColoredSelect from '@/components/shared/ColoredSelect';

function FieldSelect({ label, guide, value, options, onChange }) {
  // ColoredSelect keys by name; map the number-free names back to stored numbers.
  const opts = options.map((o) => ({ name: levelName(options, o.value), value: o.value, tone: LEVEL_TONES[o.value] }));
  return (
    <div>
      <Label className="mb-1 block text-sm font-medium text-foreground">{label}</Label>
      <ColoredSelect
        value={levelName(options, value) || ''}
        options={opts}
        onChange={(name) => onChange(opts.find((o) => o.name === name)?.value ?? null)} />
      {guide && <p className="text-xs text-muted-foreground mt-1 not-italic">{guide}</p>}
    </div>);

}

export default function RiskAssessmentColumn({ title, subtitle, accent, tooltip, likelihood, consequence, onChange }) {
  const rating = getRiskRating(likelihood, consequence);
  const score = getRiskScore(likelihood, consequence);
  const style = rating ? RATING_STYLES[rating] : null;

  return (
    <div className="rounded-xl border border-border p-4 space-y-4">
      <div>
        <div className="flex items-center gap-1.5">
          <h3 className={cn('font-semibold text-base', accent)}>{title}</h3>
          {tooltip && <InfoTooltip text={tooltip} />}
        </div>
        <p className="text-xs text-muted-foreground">{subtitle}</p>
      </div>

      <FieldSelect
        label="Likelihood"
        guide="Assess the probability of risk event occurring"
        value={likelihood}
        options={LIKELIHOOD_OPTIONS}
        onChange={(v) => onChange({ likelihood: v })} />
      

      <FieldSelect
        label="Consequence"
        guide="Assess the impact of risk event occurring"
        value={consequence}
        options={CONSEQUENCE_OPTIONS}
        onChange={(v) => onChange({ consequence: v })} />
      

      <div>
        <Label className="mb-1 block text-sm font-medium text-foreground">Risk Rating</Label>
        {rating ?
        <div className={cn('h-9 rounded-md flex items-center justify-center px-3 text-sm font-semibold', style.bg, style.text)}>
            {rating} ({score})
          </div> :

        <div className="h-9 rounded-md border border-dashed border-border flex items-center justify-center px-3 text-sm text-muted-foreground">
            Auto-calculated
          </div>
        }
        <p className="text-xs text-muted-foreground mt-1 text-center">Likelihood × Consequence </p>
      </div>
    </div>);

}