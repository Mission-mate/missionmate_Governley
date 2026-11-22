import React from 'react';

const ORDER = ['Very Low', 'Low', 'Tolerable', 'High', 'Very High'];
const COLORS = {
  'Very Low': 'bg-lime-500',
  Low: 'bg-green-600',
  Tolerable: 'bg-yellow-400',
  High: 'bg-orange-500',
  'Very High': 'bg-red-600',
};

export default function RatingDistributionBar({ ratingCounts }) {
  const counts = ratingCounts || {};
  const total = ORDER.reduce((s, k) => s + (counts[k] || 0), 0);

  return (
    <div>
      <div className="flex h-5 w-full rounded-full overflow-hidden bg-muted">
        {total === 0 ? (
          <div className="flex-1 flex items-center justify-center text-[11px] text-muted-foreground">No rated risks</div>
        ) : (
          ORDER.map((k) => {
            const pct = ((counts[k] || 0) / total) * 100;
            if (pct <= 0) return null;
            return <div key={k} className={COLORS[k]} style={{ width: `${pct}%` }} title={`${k}: ${counts[k]}`} />;
          })
        )}
      </div>
      <div className="flex flex-wrap gap-x-5 gap-y-1.5 mt-3">
        {ORDER.map((k) => (
          <div key={k} className="flex items-center gap-1.5">
            <span className={`w-2.5 h-2.5 rounded-sm ${COLORS[k]}`} />
            <span className="text-xs text-muted-foreground">{k} <span className="font-semibold text-foreground">{counts[k] || 0}</span></span>
          </div>
        ))}
      </div>
    </div>
  );
}