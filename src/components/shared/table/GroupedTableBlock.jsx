import React from 'react';

export default function GroupedTableBlock({ label, count, children }) {
  return (
    <section>
      <div className="flex items-center gap-2 mb-2">
        <h3 className="text-sm font-semibold text-foreground">{label}</h3>
        <span className="text-xs text-muted-foreground bg-muted rounded-full px-2 py-0.5">{count}</span>
      </div>
      <div className="border border-border rounded-xl overflow-x-auto bg-card">
        {children}
      </div>
    </section>
  );
}