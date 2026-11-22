import React from 'react';
import { cn } from '@/lib/utils';
import InfoTooltip from '@/components/risk/InfoTooltip';
import { ELEVATED_SECTION } from '@/components/shared/cardStyles';

const OPTIONS = [
{
  title: 'Avoid (Terminate)',
  color: 'text-rose-600',
  dot: 'bg-rose-500 border-rose-500',
  ring: 'ring-rose-500 border-rose-500 bg-rose-50/60 dark:bg-rose-400/15',
  description: 'Cease the activity that gives rise to the risk entirely because the risk is deemed unacceptable.'
},
{
  title: 'Reduce (Mitigate)',
  color: 'text-blue-600',
  dot: 'bg-blue-500 border-blue-500',
  ring: 'ring-blue-500 border-blue-500 bg-blue-50/60 dark:bg-blue-400/15',
  description: 'Implement controls or actions to reduce the likelihood or impact of the risk to an acceptable level.'
},
{
  title: 'Transfer (Share)',
  color: 'text-orange-600',
  dot: 'bg-orange-500 border-orange-500',
  ring: 'ring-orange-500 border-orange-500 bg-orange-50/60 dark:bg-orange-400/15',
  description: "Shift some or all of the risk to another party (e.g., through insurance, outsourcing, or partnerships). ",
  tooltip: 'The third-party accepting the risk should be aware of and agree to accept this obligation.'
},
{
  title: 'Accept (Tolerate)',
  color: 'text-emerald-600',
  dot: 'bg-emerald-500 border-emerald-500',
  ring: 'ring-emerald-500 border-emerald-500 bg-emerald-50/60 dark:bg-emerald-400/15',
  description: "Accept the risk as it falls within the risk appetite. No further action is required other than routine monitoring."
}];


export default function TreatmentOptionsGuide({ value, onSelect, saving }) {
  return (
    <div className={ELEVATED_SECTION}>
      <h2 className="text-base font-semibold text-foreground">Risk Treatment Strategy</h2>
      <p className="text-xs text-muted-foreground mt-0.5 mb-4">Select a strategy for managing this risk</p>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {OPTIONS.map((o) => {
          const selected = value === o.title;
          return (
            <button
              key={o.title}
              type="button"
              disabled={saving}
              onClick={() => onSelect?.(selected ? '' : o.title)}
              className={cn(
                'text-left rounded-lg border p-4 transition-all hover:shadow-md focus:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:opacity-60',
                selected
                  ? `ring-2 ${o.ring}`
                  : 'border-border bg-muted/30 hover:border-foreground/20 hover:bg-muted/50'
              )}>
              <div className="flex items-start justify-between gap-2 mb-2">
                <div className="flex items-center gap-1.5">
                  <p className={`text-sm font-semibold ${o.color}`}>{o.title}</p>
                  {o.tooltip && <InfoTooltip text={o.tooltip} />}
                </div>
                <span
                  aria-hidden="true"
                  className={cn(
                    'w-5 h-5 shrink-0 rounded-full border-2 transition-colors flex items-center justify-center',
                    selected ? o.dot : 'border-border bg-card'
                  )}>
                  {selected && <span className="w-1.5 h-1.5 rounded-full bg-primary-foreground" />}
                </span>
              </div>
              <p className="text-xs text-muted-foreground leading-relaxed">{o.description}</p>
            </button>);

        })}
      </div>
    </div>);

}