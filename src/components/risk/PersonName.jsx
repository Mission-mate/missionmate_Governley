import React from 'react';
import PersonInitialsAvatar from '@/components/shared/PersonInitialsAvatar';

/** Read-only person value: initials avatar + name. Renders nothing when empty. */
export default function PersonName({ name }) {
  if (!name) return null;
  return (
    <span className="flex items-center gap-2">
      <PersonInitialsAvatar name={name} className="h-7 w-7 text-[11px]" />
      <span className="truncate">{name}</span>
    </span>
  );
}