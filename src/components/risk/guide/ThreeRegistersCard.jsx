import React from 'react';
import { ArrowRight } from 'lucide-react';
import { ELEVATED_SECTION } from '@/components/shared/cardStyles';

const REGISTERS = [
{
  num: 1,
  title: 'Risk Register',
  tag: 'MASTER LIST',
  question: 'What could go wrong?',
  body: ' Every identified risk, recorded once with its category, owner, rating and appetite position.',
  chips: ['Category', 'Owner', 'Rating', 'Appetite'],
  footer: 'Everything else flows from here.'
},
{
  num: 2,
  title: 'Treatment Register',
  tag: 'TIME-BOUND',
  question: 'What are we doing about it?',
  body: ' Actions taken to reduce a risk to an acceptable level. Risk treatments are closed once completed.',
  chips: ['Owner', 'Due date', 'Progress status'],
  footer: "Risk Treatment has a due date"
},
{
  num: 3,
  title: 'Controls Register',
  tag: 'ONGOING',
  question: "What's already keeping it in check?",
  body: ' Policies, checks, systems and approvals that hold a risk steady day to day.',
  chips: ['Design effectiveness', 'Operating effectiveness'],
  footer: "Controls run indefinitely"
}];


export default function ThreeRegistersCard() {
  return (
    <div className={ELEVATED_SECTION}>
      <div className="flex flex-wrap items-start justify-between gap-3 mb-5">
        <div>
          <h3 className="text-base font-semibold text-foreground">The Three Registers</h3>
          <p className="text-xs text-muted-foreground mt-0.5 [font-family:'Inter',_ui-sans-serif,_system-ui,_sans-serif] font-bold">How risk information is organised</p>
        </div>
        

        
      </div>

      <div className="flex flex-col lg:flex-row items-stretch gap-3">
        {REGISTERS.map((r, i) =>
        <React.Fragment key={r.num}>
            <div className="flex-1 rounded-2xl bg-muted/60 p-5">
              <div className="flex items-center gap-2.5 mb-3">
                <span className="w-6 h-6 rounded-full bg-primary text-primary-foreground text-[11px] font-semibold flex items-center justify-center shrink-0">
                  {r.num}
                </span>
                <h4 className="text-sm font-semibold text-foreground">{r.title}</h4>
                <span className="ml-auto text-[10px] font-semibold tracking-wider text-primary/70 bg-primary/10 rounded-full px-2.5 py-1">
                  {r.tag}
                </span>
              </div>
              <p className="text-sm text-muted-foreground leading-relaxed">
                <span className="font-semibold text-foreground">{r.question}</span>
                {r.body}
              </p>
              <div className="flex flex-wrap gap-1.5 mt-3">
                {r.chips.map((c) =>
              <span
                key={c}
                className="text-[11px] text-muted-foreground bg-card rounded-full px-2.5 py-1 shadow-[0_1px_2px_rgba(16,24,40,0.05)]">
                
                    {c}
                  </span>
              )}
              </div>
              <p className="text-xs text-muted-foreground/70 mt-3.5">{r.footer}</p>
            </div>
            {i < REGISTERS.length - 1 &&
          <div className="hidden lg:flex items-center shrink-0">
                <ArrowRight className="w-4 h-4 text-muted-foreground/30" />
              </div>
          }
          </React.Fragment>
        )}
      </div>

      








      
    </div>);

}