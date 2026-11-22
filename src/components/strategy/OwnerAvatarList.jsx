import React from 'react';
import InitialsAvatar from './InitialsAvatar';

/** Displays one or more owners as a wrapping row of initials avatars. */
export default function OwnerAvatarList({ owners = [], className = '' }) {
  const list = (owners || []).filter(Boolean);
  if (list.length === 0) return <span className="text-sm text-muted-foreground">—</span>;
  return (
    <div className={`flex flex-wrap items-center gap-x-3 gap-y-1 ${className}`}>
      {list.map((name, i) => <InitialsAvatar key={`${name}-${i}`} name={name} />)}
    </div>
  );
}