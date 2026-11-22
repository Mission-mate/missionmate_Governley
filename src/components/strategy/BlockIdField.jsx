import React from 'react';
import { Input } from '@/components/ui/input';
import { blockIdLabel } from '@/lib/strategy/blockId';

/** Editable, level-aware record ID (e.g. "Measure ID"). Always user-entered. */
export default function BlockIdField({ levelName, value, onChange, error, compact = false }) {
  return (
    <div className="space-y-1.5">
      <label className={compact
        ? 'text-[11px] font-semibold text-muted-foreground uppercase tracking-wide'
        : 'text-sm font-medium text-foreground block mb-1.5'}>
        {blockIdLabel(levelName)}
      </label>
      <Input
        value={value || ''}
        onChange={(e) => onChange(e.target.value)}
        placeholder={blockIdLabel(levelName)}
        className={[compact ? 'h-8' : '', error ? 'border-red-400' : ''].join(' ')}
      />
      {error && <p className="text-xs text-red-500">{error}</p>}
    </div>
  );
}