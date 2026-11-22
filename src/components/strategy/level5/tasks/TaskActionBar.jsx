import React from 'react';
import { Eye, Pencil, Move, CircleDashed, Trash2, ChevronDown, X } from 'lucide-react';
import { AnimatePresence, motion } from 'framer-motion';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { cn } from '@/lib/utils';

const BTN = 'h-8 gap-2 text-sm';
const ICON = 'w-4 h-4';

/** Floating single-select bar for Tasks & Milestones: View, Move, Change Status (hidden for sections), Delete. */
export default function TaskActionBar({
  open, moving, moveDisabled = false, currentStatus, statuses, showStatus = true,
  onView, onEdit, onMove, onChangeStatus, onDelete, onClose, className,
}) {
  return (
    <AnimatePresence>
      {open && (
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: 12 }}
          transition={{ duration: 0.18 }}
          className={cn('flex justify-center px-4 pb-4 pt-2', className)}
        >
          <div className="flex items-center gap-1 px-3 py-2 rounded-full border border-border bg-card shadow-lg max-w-full">
            <Button variant="ghost" size="sm" onClick={onView} className={BTN}>
              <Eye className={ICON} /> View
            </Button>
            {onEdit && (
              <Button variant="ghost" size="sm" onClick={onEdit} className={BTN}>
                <Pencil className={ICON} /> Edit
              </Button>
            )}
            <Button variant="ghost" size="sm" onClick={onMove} disabled={moveDisabled} title={moveDisabled ? 'Clear filters, grouping and sorting to move rows' : undefined} className={cn(BTN, moving && 'bg-primary/10 text-primary hover:bg-primary/15 hover:text-primary')}>
              <Move className={ICON} /> {moving ? 'Done' : 'Move'}
            </Button>
            {showStatus && (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="sm" className={BTN}>
                    <CircleDashed className={ICON} /> Change Status <ChevronDown className="w-3 h-3 opacity-60" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="center" side="top" className="z-[200]">
                  {statuses.map(({ value, dot }) => (
                    <DropdownMenuItem key={value} disabled={value === currentStatus} onClick={() => onChangeStatus(value)}>
                      <span className={cn('w-2 h-2 rounded-full mr-2', dot)} /> {value}
                    </DropdownMenuItem>
                  ))}
                </DropdownMenuContent>
              </DropdownMenu>
            )}
            <Button variant="ghost" size="sm" onClick={onDelete} className={cn(BTN, 'text-destructive hover:text-destructive')}>
              <Trash2 className={ICON} /> Delete
            </Button>
            <button type="button" onClick={onClose} aria-label="Close" title="Close"
              className="ml-1 w-8 h-8 shrink-0 grid place-items-center rounded-lg text-foreground hover:bg-muted transition-colors">
              <X className={ICON} />
            </button>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}