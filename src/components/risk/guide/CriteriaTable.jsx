import React from 'react';
import { Pencil } from 'lucide-react';
import { cn } from '@/lib/utils';
import { ELEVATED_CARD } from '@/components/shared/cardStyles';

// Severity colours ordered green → red, matching the definition swatches above.
const LABEL_STYLES = [
  'bg-lime-100 text-lime-700 dark:bg-lime-400/15 dark:text-lime-300',
  'bg-green-100 text-green-700 dark:bg-green-400/15 dark:text-green-300',
  'bg-yellow-100 text-yellow-700 dark:bg-yellow-400/15 dark:text-yellow-300',
  'bg-orange-100 text-orange-700 dark:bg-orange-400/15 dark:text-orange-300',
  'bg-red-100 text-red-700 dark:bg-red-400/15 dark:text-red-300',
];

// Read-only System Assessment Criteria table with a single edit affordance.
// Category names are fixed; only the criteria text is user-editable (via onEdit).
export default function CriteriaTable({ title, categoryLabel, rows = [], onEdit }) {
  return (
    <div className={cn(ELEVATED_CARD, 'overflow-hidden')}>
      <div className="flex items-center justify-between px-5 py-3.5 border-b border-border">
        <h3 className="text-sm font-semibold text-foreground">{title}</h3>
        <button
          onClick={onEdit}
          title="Edit assessment criteria"
          className="inline-flex items-center gap-1.5 text-xs font-medium text-muted-foreground hover:text-foreground transition-colors"
        >
          <Pencil className="w-3.5 h-3.5" /> Edit
        </button>
      </div>
      <table className="w-full text-sm">
        <thead>
          <tr className="bg-secondary/40 text-left">
            <th className="px-5 py-2.5 text-xs font-semibold text-foreground/80 uppercase tracking-wide align-middle w-1/3">{categoryLabel}</th>
            <th className="px-5 py-2.5 text-xs font-semibold text-foreground/80 uppercase tracking-wide align-middle">Assessment Criteria</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((row, idx) => (
            <tr key={row.name} className="border-t border-border align-top">
              <td className="px-5 py-3">
                <span className={cn('inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold', LABEL_STYLES[idx] || LABEL_STYLES[LABEL_STYLES.length - 1])}>
                  {row.name}
                </span>
              </td>
              <td className="px-5 py-3 text-muted-foreground">
                <ul className="space-y-0.5">
                  {row.criteria.split('\n').filter(Boolean).map((line, i) => {
                    const bold = /^(Financial|Probability)/i.test(line.trim());
                    return (
                      <li key={i} className={bold ? 'text-foreground font-medium' : ''}>
                        {line}
                      </li>
                    );
                  })}
                </ul>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}