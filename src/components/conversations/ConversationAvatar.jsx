import React from 'react';
import PersonAvatar from './PersonAvatar';
import { otherMemberId } from '@/lib/conversations';
import { groupColor } from '@/lib/groupColors';
import { initialsOf } from '@/lib/initials';
import { cn } from '@/lib/utils';

/** Group conversations show an initials tile in the group's colour; direct ones show the other person. */
export default function ConversationAvatar({ conversation, meId, people, className }) {
  if (conversation.type === 'group') {
    return (
      <span
        aria-hidden="true"
        className={cn('shrink-0 inline-flex items-center justify-center rounded-full h-10 w-10 text-xs font-semibold tracking-wide text-white', className)}
        style={{ background: groupColor(conversation.color) }}
      >
        {initialsOf(conversation.name) || 'G'}
      </span>
    );
  }
  return <PersonAvatar person={people.get(otherMemberId(conversation, meId))} className={cn('h-10 w-10', className)} />;
}