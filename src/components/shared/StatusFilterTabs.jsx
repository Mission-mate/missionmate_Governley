import React from 'react';
import { cn } from '@/lib/utils';

/**
 * Underline status tabs (All + each status) with count badges; empty statuses read as disabled.
 * statuses: [{ value }], getStatus(item) → status value.
 */
export default function StatusFilterTabs({ items, statuses, getStatus, value, onChange, className }) {
  const tabs = [{ key: 'all', label: 'All', count: items.length },
    ...statuses.map(({ value: s }) => ({ key: s, label: s, count: items.filter((t) => getStatus(t) === s).length }))];
  return (
    <div role="tablist" className={cn('flex items-end gap-6 px-6 border-b border-border overflow-x-auto', className)}>
      {tabs.map((t) => {
        const active = value === t.key;
        const empty = t.count === 0 && t.key !== 'all';
        return (
          <button key={t.key} type="button" role="tab" aria-selected={active} disabled={empty && !active} onClick={() => onChange(t.key)}
            className={cn('relative flex items-center gap-2 pb-2.5 pt-1 text-sm font-semibold whitespace-nowrap transition-colors',
              active ? 'text-foreground' : empty ? 'text-muted-foreground/50 cursor-default' : 'text-muted-foreground hover:text-foreground')}>
            {t.label}
            <span className={cn('min-w-[20px] h-5 px-1.5 rounded-full inline-flex items-center justify-center text-[11px] font-medium tabular-nums',
              active ? 'bg-primary/15 text-primary dark:text-primary-foreground' : 'bg-muted text-muted-foreground', empty && 'opacity-60')}>
              {t.count}
            </span>
            <span className={cn('absolute inset-x-0 -bottom-px h-0.5 rounded-full bg-foreground transition-opacity', active ? 'opacity-100' : 'opacity-0')} />
          </button>
        );
      })}
    </div>
  );
}