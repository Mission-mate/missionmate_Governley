import React from 'react';
import { cn } from '@/lib/utils';
import { RATING_STYLES } from '@/lib/riskMatrix';

export default function RatingBadge({ rating, className }) {
  if (!rating) {
    return <span className="text-xs text-muted-foreground">—</span>;
  }
  const style = RATING_STYLES[rating] || { bg: 'bg-muted', text: 'text-foreground' };
  return (
    <span className={cn('inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold', style.bg, style.text, className)}>
      {rating}
    </span>
  );
}