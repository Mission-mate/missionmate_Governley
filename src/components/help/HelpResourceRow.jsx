import React from 'react';
import { ArrowUpRight } from 'lucide-react';
import HelpIconTile from './HelpIconTile';

/** External resource link row with a trailing arrow. */
export default function HelpResourceRow({ icon, tone, title, subtitle, href }) {
  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      className="group -mx-2 flex items-center gap-3.5 rounded-xl px-2 py-2.5 transition-colors hover:bg-muted/70"
    >
      <HelpIconTile icon={icon} tone={tone} />
      <span className="min-w-0 flex-1">
        <span className="block text-[15px] font-medium text-foreground">{title}</span>
        <span className="block truncate text-[13px] text-muted-foreground">{subtitle}</span>
      </span>
      <ArrowUpRight className="h-4 w-4 shrink-0 text-muted-foreground/70 transition-colors group-hover:text-foreground" />
    </a>
  );
}