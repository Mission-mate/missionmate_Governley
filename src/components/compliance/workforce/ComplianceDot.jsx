import React from 'react';

const DOT = { 'On Track': 'bg-green-600', 'At Risk': 'bg-amber-600' };
const TEXT = { 'On Track': 'text-green-700 dark:text-green-400', 'At Risk': 'text-amber-700 dark:text-amber-400' };

/** Coloured dot + label for a compliance value. */
export default function ComplianceDot({ value }) {
  if (!value) return <span className="text-sm text-muted-foreground">—</span>;
  return (
    <span className={`inline-flex items-center gap-1.5 text-sm font-medium ${TEXT[value]}`}>
      <span className={`w-2 h-2 rounded-full ${DOT[value]}`} />{value}
    </span>
  );
}