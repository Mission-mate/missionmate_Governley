import React from 'react';
import PersonInitialsAvatar from '@/components/shared/PersonInitialsAvatar';
import { META_EDITABLE } from '@/components/shared/metaStyles';
import { cn } from '@/lib/utils';

/** Free-text owner with initials avatar; controlled by the parent draft. Hover tint marks it editable. */
export default function TaskOwnerField({ value, onChange, readOnly = false }) {
  const owner = value || '';
  const has = !!owner.trim();
  const avatar = has && <PersonInitialsAvatar name={owner} className="h-6 w-6 text-[9px]" />;

  if (readOnly) {
    return (
      <div className="flex items-center gap-2 min-w-0">
        {avatar}
        <span className={cn('truncate', !has && 'text-muted-foreground')}>{has ? owner : 'Unassigned'}</span>
      </div>
    );
  }

  return (
    <label title="Assign task owner" className={cn('flex items-center gap-2 min-w-0 py-1 -ml-2.5 pr-2.5', has ? 'pl-1' : 'pl-2.5', META_EDITABLE)}>
      {avatar}
      <input
        value={owner}
        onChange={(e) => onChange(e.target.value)}
        onKeyDown={(e) => { if (e.key === 'Enter') e.currentTarget.blur(); }}
        placeholder="Unassigned"
        className="flex-1 min-w-0 bg-transparent border-0 p-0 outline-none cursor-text placeholder:text-muted-foreground"
      />
    </label>
  );
}