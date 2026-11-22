import React from 'react';

/** Blank-editor hint with the "/" rendered as a small keycap. */
export default function SlashPlaceholder({ style }) {
  return (
    <div style={style} className="absolute whitespace-nowrap pointer-events-none select-none text-sm leading-relaxed text-muted-foreground/50">
      Start writing, or type{' '}
      <kbd className="inline-flex items-center justify-center min-w-[20px] h-5 px-1.5 mx-0.5 rounded-md border border-border bg-muted/50 font-mono text-xs text-muted-foreground align-middle">/</kbd>
      {' '}for blocks…
    </div>
  );
}