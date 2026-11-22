/**
 * ActionMenu — standardized portal-based "..." action menu.
 * Renders via Radix DropdownMenu so it never gets clipped by parent
 * overflow/containers, auto-repositions on collision, and stays above content.
 *
 * Usage:
 *   <ActionMenu items={[
 *     { label: 'View', icon: Eye, onClick: () => {} },
 *     { label: 'Edit', icon: Pencil, onClick: () => {} },
 *     { label: 'Delete', icon: Trash2, onClick: () => {}, destructive: true },
 *   ]} />
 */
import React from 'react';
import { MoreHorizontal } from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
} from '@/components/ui/dropdown-menu';
import { cn } from '@/lib/utils';

export default function ActionMenu({ items = [], align = 'end', triggerClassName, icon: TriggerIcon = MoreHorizontal }) {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button
          className={cn('text-muted-foreground hover:text-foreground transition-colors p-1 rounded-md outline-none focus-visible:ring-1 focus-visible:ring-ring', triggerClassName)}
          onClick={e => e.stopPropagation()}
        >
          <TriggerIcon className="w-5 h-5" />
        </button>
      </DropdownMenuTrigger>
      {/* z above SlidePane (z-[101]) so pane-hosted menus aren't painted behind the pane */}
      <DropdownMenuContent align={align} className="w-40 z-[200]">
        {items.map((item, i) => {
          const Icon = item.icon;
          return (
            <DropdownMenuItem
              key={i}
              onClick={(e) => { e.stopPropagation(); item.onClick?.(); }}
              className={cn(item.destructive && 'text-destructive focus:text-destructive')}
            >
              {Icon && <Icon className="w-4 h-4 mr-2" />}
              {item.label}
            </DropdownMenuItem>
          );
        })}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}