import React from 'react';

/** A block of the conversation details panel. With a `title`, shows a header with an optional count on the right. */
export default function DetailsSection({ title, count, children }) {
  return (
    <section className="px-5 py-4 border-b border-border last:border-0">
      {title && (
        <div className="flex items-center justify-between mb-2">
          <h3 className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">{title}</h3>
          {count != null && <span className="text-[11px] font-semibold text-muted-foreground tabular-nums">{count}</span>}
        </div>
      )}
      {children}
    </section>
  );
}