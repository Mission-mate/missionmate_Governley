import React from 'react';
import { MoreHorizontal, ShieldCheck, ShieldOff, UserMinus } from 'lucide-react';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import PersonAvatar from './PersonAvatar';
import { personName } from '@/lib/conversations';

/** One group member. Group admins get a menu to change the member's role or remove them. */
export default function GroupMemberRow({ id, meId, people, isAdmin, canManage, busy, onSetAdmin, onRemove }) {
  const person = people.get(id);
  const isMe = id === meId;
  return (
    <div className="group flex items-center gap-3 px-2 py-1.5 rounded-lg hover:bg-muted/60 transition-colors duration-200">
      <PersonAvatar person={person} className="h-8 w-8 text-[11px]" />
      <div className="flex-1 min-w-0">
        <p className="text-sm font-semibold text-foreground truncate">{isMe ? 'You' : personName(people, id)}</p>
        {person?.email && <p className="text-xs text-muted-foreground truncate">{person.email}</p>}
      </div>
      {isAdmin && (
        <span className="shrink-0 rounded-full px-2 py-0.5 text-[11px] font-semibold bg-primary/10 text-primary">Admin</span>
      )}
      {canManage && (
        <DropdownMenu modal={false}>
          <DropdownMenuTrigger asChild>
            <button
              type="button"
              disabled={busy}
              className="w-7 h-7 rounded-lg flex items-center justify-center shrink-0 text-muted-foreground lg:opacity-0 lg:group-hover:opacity-100 focus-visible:opacity-100 data-[state=open]:opacity-100 hover:bg-muted hover:text-foreground transition-[opacity,background-color,color] duration-200"
            >
              <MoreHorizontal className="w-4 h-4" strokeWidth={1.8} />
              <span className="sr-only">Member options</span>
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-48">
            {isAdmin ? (
              <DropdownMenuItem onSelect={() => onSetAdmin(id, false)}>
                <ShieldOff className="w-4 h-4" strokeWidth={1.8} /> Remove admin
              </DropdownMenuItem>
            ) : (
              <DropdownMenuItem onSelect={() => onSetAdmin(id, true)}>
                <ShieldCheck className="w-4 h-4" strokeWidth={1.8} /> Make admin
              </DropdownMenuItem>
            )}
            {!isMe && (
              <>
                <DropdownMenuSeparator />
                <DropdownMenuItem onSelect={() => onRemove(id)} className="text-destructive focus:text-destructive">
                  <UserMinus className="w-4 h-4" strokeWidth={1.8} /> Remove from group
                </DropdownMenuItem>
              </>
            )}
          </DropdownMenuContent>
        </DropdownMenu>
      )}
    </div>
  );
}