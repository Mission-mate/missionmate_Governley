import React from 'react';
import { Link } from 'react-router-dom';
import { SlidersHorizontal, Power } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { base44 } from '@/api/base44Client';
import { cn } from '@/lib/utils';

const PROFILE_PATH = '/settings?tab=my-profile';
const ROW = 'group flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium cursor-pointer transition-colors focus:bg-composer data-[highlighted]:bg-composer';
const CIRCLE = 'flex h-9 w-9 shrink-0 items-center justify-center rounded-full border bg-popover';
const AVATAR = 'bg-amber-100 text-amber-700 dark:bg-amber-400/15 dark:text-amber-300';

/** Header account menu: profile, Settings and Sign out on a soft rounded card. */
export default function AccountMenu({ user, initials }) {
  const name = user?.full_name || 'User';
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="icon" className="h-8 w-8 ml-1 rounded-full">
          <Avatar className="h-7 w-7">
            <AvatarFallback className={cn(AVATAR, 'text-xs font-medium')}>
              {initials}
            </AvatarFallback>
          </Avatar>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent
        align="end"
        sideOffset={8}
        className="w-64 rounded-2xl border-border/70 bg-popover p-1.5 shadow-[0_12px_32px_-8px_rgba(14,16,20,0.18)] dark:shadow-[0_12px_32px_-8px_rgba(0,0,0,0.6)]"
      >
        <DropdownMenuItem asChild className={ROW}>
          <Link to={PROFILE_PATH}>
            <span className="relative shrink-0">
              <Avatar className="h-10 w-10">
                <AvatarFallback className={cn(AVATAR, 'text-sm font-semibold')}>{initials}</AvatarFallback>
              </Avatar>
              <span className="absolute bottom-0 right-0 h-2.5 w-2.5 rounded-full bg-emerald-500 ring-2 ring-popover" />
            </span>
            <span className="min-w-0">
              <span className="block truncate text-foreground">{name}</span>
              {user?.email && <span className="block truncate text-xs font-normal text-muted-foreground">{user.email}</span>}
            </span>
          </Link>
        </DropdownMenuItem>
        <DropdownMenuSeparator className="mx-2 my-1.5" />
        <DropdownMenuItem asChild className={ROW}>
          <Link to={PROFILE_PATH}>
            <span className={cn(CIRCLE, 'border-border text-foreground/80')}>
              <SlidersHorizontal className="w-4 h-4" strokeWidth={1.75} />
            </span>
            Settings
          </Link>
        </DropdownMenuItem>
        <DropdownMenuItem
          className={cn(ROW, 'text-destructive focus:text-destructive focus:bg-destructive/10 data-[highlighted]:bg-destructive/10')}
          onClick={() => base44.auth.logout()}
        >
          <span className={cn(CIRCLE, 'border-destructive/40 text-destructive')}>
            <Power className="w-4 h-4" strokeWidth={1.75} />
          </span>
          Sign out
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}