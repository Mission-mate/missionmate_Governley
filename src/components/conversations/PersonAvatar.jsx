import React from 'react';
import PersonInitialsAvatar from '@/components/shared/PersonInitialsAvatar';
import { cn } from '@/lib/utils';

/** A team member's profile picture, falling back to the app's initials circle. */
export default function PersonAvatar({ person, className }) {
  if (person?.avatar_url) {
    return <img src={person.avatar_url} alt="" className={cn('shrink-0 rounded-full h-9 w-9 object-cover', className)} />;
  }
  return <PersonInitialsAvatar name={person?.name} className={className} />;
}