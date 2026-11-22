import React from 'react';
import { Plus } from 'lucide-react';
import PollIcon from './polls/PollIcon';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';

/** The composer's "+" control: a compact menu of extra things to add to the conversation. */
export default function ComposerAddMenu({ onAddPoll, disabled, triggerClassName }) {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button type="button" title="Add" disabled={disabled} className={triggerClassName}>
          <Plus className="w-[18px] h-[18px]" strokeWidth={1.8} />
          <span className="sr-only">Add</span>
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent side="top" align="start" sideOffset={8} className="min-w-[160px] rounded-xl p-1">
        <DropdownMenuItem onSelect={onAddPoll} className="gap-2.5 rounded-lg px-2.5 py-2 cursor-pointer">
          <PollIcon className="w-4 h-4 text-muted-foreground" />
          <span className="text-sm">Poll</span>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}