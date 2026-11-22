import React from 'react';
import { Info } from 'lucide-react';
import { cn } from '@/lib/utils';

const Block = ({ label, children }) =>
<div className="pl-6">
    <p className="text-[10px] font-semibold uppercase tracking-wider text-foreground/70 mb-0.5">{label}</p>
    <p className="text-xs text-muted-foreground leading-relaxed whitespace-pre-line">{children}</p>
  </div>;


/** Explanatory guide card shown in the Level 6 Reporting Settings pane. */
export default function ReportingGuideCard({ title, body, useCase, example }) {
  return (
    <div className={cn("rounded-xl p-4 space-y-3 bg-[hsl(var(--sidebar-accent))]")}>
      <div className="flex items-start gap-2">
        <Info className="w-4 h-4 mt-0.5 shrink-0 text-muted-foreground" />
        <div>
          <p className="text-sm font-bold text-foreground">{title}</p>
          <p className="text-xs text-muted-foreground leading-relaxed mt-1">{body}</p>
        </div>
      </div>
      {useCase && <Block label="When to use it">{useCase}</Block>}
      {example && <Block label="Example">{example}</Block>}
    </div>);

}