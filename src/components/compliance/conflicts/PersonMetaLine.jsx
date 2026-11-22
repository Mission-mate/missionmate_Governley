import React from 'react';
import { Mail, Building2, Briefcase } from 'lucide-react';
import { cn } from '@/lib/utils';

/** Role · Division · Email row with icons — shows only populated values. */
export default function PersonMetaLine({ person, className }) {
  const meta = [
    { icon: Briefcase, value: person?.role },
    { icon: Building2, value: person?.division },
    { icon: Mail, value: person?.email },
  ].filter((m) => m.value);
  if (!meta.length) return null;
  return (
    <div className={cn('flex flex-wrap gap-x-4 gap-y-1', className)}>
      {meta.map(({ icon: Icon, value }) => (
        <span key={value} className="flex items-center gap-1.5 text-xs text-muted-foreground min-w-0">
          <Icon className="w-3.5 h-3.5 shrink-0" /><span className="truncate">{value}</span>
        </span>
      ))}
    </div>
  );
}