import React from 'react';
import SlidePane from '@/components/ui/SlidePane';
import { SUMMARY_GUIDES } from './summaryGuides';
import CloseButton from '@/components/shared/CloseButton';

// Right pane explaining how a Risk Overview summary card is calculated.
export default function SummaryGuidePane({ isOpen, onClose, label, value }) {
  const guide = SUMMARY_GUIDES[label];

  return (
    <SlidePane isOpen={isOpen} onClose={onClose}>
      <div className="h-full bg-card border-l border-border flex flex-col">
        <div className="flex items-start justify-between gap-3 px-6 py-4 border-b border-border shrink-0">
          <div className="min-w-0">
            <div className="flex items-center gap-2">
              <h2 className="text-base font-semibold text-foreground truncate">{label}</h2>
              {value !== undefined && (
                <span className="shrink-0 text-[11px] font-semibold text-muted-foreground bg-muted rounded-full px-2.5 py-1">
                  {value}
                </span>
              )}
            </div>
            <p className="text-xs text-muted-foreground mt-0.5">How this figure is calculated</p>
          </div>
          <CloseButton onClick={onClose} className="shrink-0" />
        </div>

        <div className="flex-1 overflow-y-auto px-5 py-5 space-y-3">
          {!guide ? (
            <p className="text-sm text-muted-foreground text-center py-10">No guide available.</p>
          ) : (
            <>
              <div className="rounded-2xl bg-muted p-4">
                <p className="text-sm text-foreground">{guide.intro}</p>
              </div>

              <div className="rounded-2xl bg-muted p-4">
                <p className="text-sm font-semibold text-foreground">How it's calculated</p>
                <ol className="mt-3 space-y-2.5">
                  {guide.steps.map((step, i) => (
                    <li key={i} className="flex gap-2.5">
                      <span className="shrink-0 w-5 h-5 rounded-full bg-card text-[11px] font-semibold text-muted-foreground flex items-center justify-center shadow-[0_1px_2px_rgba(16,24,40,0.05)]">
                        {i + 1}
                      </span>
                      <span className="text-xs text-muted-foreground leading-relaxed">{step}</span>
                    </li>
                  ))}
                </ol>
              </div>

              <div className="rounded-2xl bg-muted p-4">
                <p className="text-sm font-semibold text-foreground">Example</p>
                <p className="text-xs text-muted-foreground mt-1.5 leading-relaxed">{guide.example}</p>
              </div>

              <div className="rounded-2xl bg-muted p-4">
                <p className="text-sm font-semibold text-foreground">Good to know</p>
                <p className="text-xs text-muted-foreground mt-1.5 leading-relaxed">{guide.note}</p>
              </div>
            </>
          )}
        </div>
      </div>
    </SlidePane>
  );
}