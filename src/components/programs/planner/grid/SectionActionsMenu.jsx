import React from 'react';
import { MoreVertical, Eye, Pencil, ArrowUp, ArrowDown, ArrowLeft, ArrowRight, Move, Trash2 } from 'lucide-react';
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator,
  DropdownMenuSub, DropdownMenuSubTrigger, DropdownMenuSubContent, DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

/** Vertical 3-dot section actions: View, Edit, Move (within planner), Delete. */
export default function SectionActionsMenu({ section, actions, horizontal = false }) {
  const { index, count, onView, onEdit, onMove, onDelete } = actions;
  const [Back, Fwd] = horizontal ? [ArrowLeft, ArrowRight] : [ArrowUp, ArrowDown];
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button aria-label="Section actions" onClick={(e) => e.stopPropagation()}
          className="w-7 h-7 shrink-0 rounded-md flex items-center justify-center text-muted-foreground hover:bg-muted hover:text-foreground dark:hover:bg-accent transition-colors">
          <MoreVertical className="w-4 h-4" />
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-44">
        <DropdownMenuItem onSelect={() => onView(section)} className="gap-2"><Eye className="w-4 h-4" /> View</DropdownMenuItem>
        <DropdownMenuItem onSelect={() => onEdit(section)} className="gap-2"><Pencil className="w-4 h-4" /> Edit</DropdownMenuItem>
        <DropdownMenuSub>
          <DropdownMenuSubTrigger className="gap-2" disabled={count < 2}><Move className="w-4 h-4" /> Move</DropdownMenuSubTrigger>
          <DropdownMenuSubContent>
            <DropdownMenuItem disabled={index <= 0} onSelect={() => onMove(section, -1)} className="gap-2"><Back className="w-4 h-4" /> {horizontal ? 'Move left' : 'Move up'}</DropdownMenuItem>
            <DropdownMenuItem disabled={index >= count - 1} onSelect={() => onMove(section, 1)} className="gap-2"><Fwd className="w-4 h-4" /> {horizontal ? 'Move right' : 'Move down'}</DropdownMenuItem>
          </DropdownMenuSubContent>
        </DropdownMenuSub>
        <DropdownMenuSeparator />
        <DropdownMenuItem onSelect={() => onDelete(section)} className="gap-2 text-destructive focus:text-destructive"><Trash2 className="w-4 h-4" /> Delete</DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}