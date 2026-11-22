import React from 'react';
import { ELEVATED_SECTION } from '@/components/shared/cardStyles';

const BANDS = [
{
  num: 1,
  title: 'Within Appetite',
  tag: 'BELOW THRESHOLD',
  body: 'Risks scored below the threshold. These are generally acceptable and require standard monitoring.'
},
{
  num: 2,
  title: 'Outside Appetite',
  tag: 'AT OR ABOVE THRESHOLD',
  body: 'Risks scored at or above the threshold. These require immediate executive attention and robust mitigation plans to bring them back within acceptable levels.'
}];


export default function RiskAppetiteCard() {
  return (
    <div className={ELEVATED_SECTION}>
      <h3 className="text-base font-semibold text-foreground">Risk Appetite</h3>
      <p className="text-xs text-primary/70 mt-0.5 mb-4 [font-family:'Inter',_ui-sans-serif,_system-ui,_sans-serif] font-bold">Organisational tolerance for risk</p>
      <p className="text-sm text-muted-foreground leading-relaxed">
        <span className="font-semibold text-foreground">Risk Appetite</span> represents the amount and
        type of risk the organisation is willing to pursue or retain.
      </p>

      <div className="mt-4 grid grid-cols-1 sm:grid-cols-2 gap-3">
        {BANDS.map((b) =>
        <div key={b.num} className="rounded-2xl bg-muted/60 p-4">
            <div className="flex items-center gap-2 mb-1.5">
              <span className="w-5 h-5 rounded-full bg-primary text-primary-foreground text-[10px] font-semibold flex items-center justify-center shrink-0">
                {b.num}
              </span>
              <h4 className="text-sm font-semibold text-foreground">{b.title}</h4>
            </div>
            <span className="inline-block text-[10px] tracking-wider text-primary/70 bg-primary/10 rounded-full px-2 py-0.5 mb-2 [font-family:'Inter',_ui-sans-serif,_system-ui,_sans-serif] font-bold">
              {b.tag}
            </span>
            <p className="text-[13px] text-muted-foreground leading-snug">{b.body}</p>
          </div>
        )}
      </div>
    </div>);

}