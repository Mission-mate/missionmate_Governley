import React from 'react';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import PersonAvatar from '../PersonAvatar';
import { personName } from '@/lib/conversations';

const AVATARS_SHOWN = 4;

function summary(names) {
  if (names.length <= 2) return names.join(' and ');
  return `${names[0]}, ${names[1]} and ${names.length - 2} more`;
}

/** Who chose one poll option: an avatar stack and names, with the full list in a popover. */
export default function PollVoters({ option, people }) {
  const voters = option.voter_ids
    .map((id) => ({ id, person: people.get(id), name: personName(people, id) }))
    .sort((a, b) => a.name.localeCompare(b.name));
  if (voters.length === 0) return null;

  return (
    <Popover>
      <PopoverTrigger asChild>
        <button
          type="button"
          title="See who voted"
          className="mt-1 ml-1 inline-flex max-w-full items-center gap-1.5 rounded-full px-1.5 py-0.5 text-[11px] text-muted-foreground hover:bg-muted hover:text-foreground transition-colors duration-200"
        >
          <span className="flex -space-x-1.5 shrink-0">
            {voters.slice(0, AVATARS_SHOWN).map((v) => (
              <PersonAvatar key={v.id} person={v.person} className="h-5 w-5 text-[8px] ring-2 ring-card" />
            ))}
          </span>
          <span className="truncate">{summary(voters.map((v) => v.name))}</span>
        </button>
      </PopoverTrigger>
      <PopoverContent align="start" className="w-60 p-2">
        <p className="px-1.5 pb-1.5 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground truncate">
          {option.text} · {voters.length} {voters.length === 1 ? 'vote' : 'votes'}
        </p>
        <ul className="max-h-56 overflow-y-auto space-y-0.5">
          {voters.map((v) => (
            <li key={v.id} className="flex items-center gap-2 rounded-md px-1.5 py-1 text-sm text-foreground">
              <PersonAvatar person={v.person} className="h-6 w-6 text-[9px]" />
              <span className="truncate">{v.name}</span>
            </li>
          ))}
        </ul>
      </PopoverContent>
    </Popover>
  );
}