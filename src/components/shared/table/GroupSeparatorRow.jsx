import React from 'react';

/**
 * Full-width group separator row used inside a single grouped table so that
 * every group shares the one table header's column widths (no column skew).
 */
export default function GroupSeparatorRow({ label, count, colSpan, isFirst = false }) {
  return (
    <tr className="bg-muted/30 hover:bg-muted/30">
      <td colSpan={colSpan} className={isFirst ? 'px-4 py-2' : 'px-4 py-2 border-t border-border'}>
        <div className="flex items-center gap-2">
          <span className="text-sm font-semibold text-foreground">{label}</span>
          <span className="text-xs text-muted-foreground bg-muted rounded-full px-2 py-0.5">{count}</span>
        </div>
      </td>
    </tr>
  );
}