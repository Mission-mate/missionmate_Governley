import React from 'react';
import { List, BarChart3 } from 'lucide-react';
import { cn } from '@/lib/utils';

const VIEWS = [
  { value: 'list', label: 'List', icon: List },
  { value: 'charts', label: 'Charts', icon: BarChart3 },
];

export default function AssetViewSwitcher({ value, onChange }) {
  return (
    <div role="tablist" className="inline-flex items-center h-9 p-1 rounded-[10px] bg-muted">
      {VIEWS.map(({ value: v, label, icon: Icon }) => (
        <button
          key={v}
          type="button"
          role="tab"
          aria-selected={value === v}
          onClick={() => onChange(v)}
          className={cn(
            'h-7 px-3 inline-flex items-center gap-1.5 rounded-lg text-sm font-medium transition-all duration-200',
            value === v ? 'bg-[hsl(var(--tab-active))] text-foreground shadow-sm' : 'text-muted-foreground hover:text-foreground'
          )}
        >
          <Icon className="w-4 h-4" /> {label}
        </button>
      ))}
    </div>
  );
}