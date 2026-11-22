import React from 'react';
import { Activity } from 'lucide-react';
import { cn } from '@/lib/utils';
import { healthStyle } from '../level3/health';

/**
 * Compact health indicator for detail-pane headers.
 * Renders a single consistent activity/pulse icon + the health status
 * ("On Track", "Monitor", "Off Track") at 16px, coloured by status,
 * with no "Health" label to keep the banner sleek.
 */
export default function HealthHeaderBadge({ health }) {
  const hs = healthStyle(health || '');
  return (
    <span className={cn("inline-flex items-center gap-1.5 [font-family:'Inter',_ui-sans-serif,_system-ui,_sans-serif] font-bold text-[16px]", health ? hs.text : 'text-muted-foreground')}>
      <Activity className="w-4 h-4 shrink-0" strokeWidth={2.25} />
      {health || '—'}
    </span>);

}