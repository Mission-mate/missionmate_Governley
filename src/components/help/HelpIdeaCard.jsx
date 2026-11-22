import React from 'react';
import { Lightbulb, ChevronRight } from 'lucide-react';
import HelpIconTile from './HelpIconTile';

/** Warm dashed card that opens the Ideaboard submission form. */
export default function HelpIdeaCard({ onClick }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="flex w-full items-center gap-3.5 rounded-2xl border border-dashed border-yellow-400/70 bg-yellow-50 p-4 text-left transition-colors hover:bg-yellow-100/70 dark:border-yellow-400/30 dark:bg-yellow-400/[0.07] dark:hover:bg-yellow-400/[0.12]"
    >
      <HelpIconTile icon={Lightbulb} tone="yellow" />
      <span className="min-w-0 flex-1">
        <span className="block text-[15px] font-semibold text-foreground">Got an idea?</span>
        <span className="block text-[13px] text-yellow-800 dark:text-yellow-200/80">Share a feature request on the Ideaboard</span>
      </span>
      <ChevronRight className="h-4 w-4 shrink-0 text-yellow-700 dark:text-yellow-300" />
    </button>
  );
}