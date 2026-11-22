import React from 'react';
import HelpIconTile from './HelpIconTile';

/** Half-width option card (Raise a ticket, Book a call). */
export default function HelpTile({ icon, tone, title, subtitle, onClick }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="flex flex-col gap-3.5 rounded-2xl border border-border bg-card p-4 text-left transition-[border-color,box-shadow] hover:border-foreground/15 hover:shadow-[0_6px_18px_rgba(14,16,20,0.06)] dark:hover:shadow-[0_6px_18px_rgba(0,0,0,0.3)]"
    >
      <HelpIconTile icon={icon} tone={tone} />
      <span>
        <span className="block text-[15px] font-semibold text-foreground">{title}</span>
        <span className="mt-0.5 block text-xs leading-snug text-muted-foreground">{subtitle}</span>
      </span>
    </button>
  );
}