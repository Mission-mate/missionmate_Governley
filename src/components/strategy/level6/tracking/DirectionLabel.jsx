import React from 'react';
import { ArrowUp, ArrowDown } from 'lucide-react';

/** "↑↓ Higher is Better" — arrows show which way is good (green) and which is bad (red). */
export default function DirectionLabel({ value }) {
  if (!value) return <span className="text-sm text-foreground">—</span>;
  const higher = value === 'Higher is Better';
  return (
    <span className="inline-flex items-center gap-1.5 text-sm text-foreground">
      <span className="inline-flex items-center">
        <ArrowUp className={`w-3.5 h-3.5 ${higher ? 'text-green-600' : 'text-red-500'}`} />
        <ArrowDown className={`w-3.5 h-3.5 ${higher ? 'text-red-500' : 'text-green-600'}`} />
      </span>
      {value}
    </span>
  );
}