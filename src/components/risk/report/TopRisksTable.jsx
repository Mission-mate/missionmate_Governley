import React from 'react';
import RatingBadge from '@/components/risk/RatingBadge';
import { ELEVATED_CARD } from '@/components/shared/cardStyles';

export default function TopRisksTable({ risks = [] }) {
  if (risks.length === 0) {
    return <p className="text-sm text-muted-foreground py-4">No rated residual risks recorded.</p>;
  }
  return (
    <div className={`${ELEVATED_CARD} overflow-hidden`}>
      <table className="w-full text-sm">
        <thead>
          <tr className="bg-secondary/40 text-left">
            <th className="px-3 py-2 text-xs font-semibold text-foreground/80 uppercase tracking-wide">Risk</th>
            <th className="px-3 py-2 text-xs font-semibold text-foreground/80 uppercase tracking-wide">Category</th>
            <th className="px-3 py-2 text-xs font-semibold text-foreground/80 uppercase tracking-wide">Owner</th>
            <th className="px-3 py-2 text-xs font-semibold text-foreground/80 uppercase tracking-wide text-right">Residual</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-border">
          {risks.map((r, i) => (
            <tr key={i} className="hover:bg-sidebar-accent/70 transition-colors">
              <td className="px-3 py-2.5">
                <span className="font-medium text-foreground">{r.title}</span>
                {r.risk_id && <span className="ml-2 text-xs text-muted-foreground">{r.risk_id}</span>}
              </td>
              <td className="px-3 py-2.5 text-muted-foreground">{r.category}</td>
              <td className="px-3 py-2.5 text-muted-foreground">{r.owner}</td>
              <td className="px-3 py-2.5 text-right"><RatingBadge rating={r.residual_rating} /></td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}