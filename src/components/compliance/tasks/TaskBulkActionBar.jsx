import React from 'react';
import { Eye, Move, CircleDashed, Trash2, ChevronDown, X } from 'lucide-react';
import { AnimatePresence, motion } from 'framer-motion';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { cn } from '@/lib/utils';
import { TASK_STATUSES } from '@/lib/obligationTasks';

const BTN = 'h-7 gap-1.5 px-2.5 text-[13px]';
const ICON = 'w-3.5 h-3.5';
const STATUSES = TASK_STATUSES.map(({ value, tone }) => ({ value, dot: tone.dot }));

/** Single-task in-pane action bar: View, Move, Change Status, Delete. */
export default function TaskBulkActionBar({ open, moving, currentStatus, onView, onMove, onChangeStatus, onDelete, onClose }) {
  return (
    <AnimatePresence>
      {open && (
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: 12 }}
          transition={{ duration: 0.18 }}
          className="flex justify-center px-4 pb-4 pt-2 shrink-0"
        >
          <div className="flex items-center gap-0.5 px-1.5 py-1 rounded-full border border-border bg-card shadow-lg max-w-full">
            <Button variant="ghost" size="sm" onClick={onView} className={BTN}>
              <Eye className={ICON} /> View
            </Button>
            <Button variant="ghost" size="sm" onClick={onMove} className={cn(BTN, moving && 'bg-primary/10 text-primary hover:bg-primary/15 hover:text-primary')}>
              <Move className={ICON} /> {moving ? 'Done' : 'Move'}
            </Button>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="sm" className={BTN}>
                  <CircleDashed className={ICON} /> Change Status <ChevronDown className="w-3 h-3 opacity-60" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="center" side="top" className="z-[200]">
                {STATUSES.map(({ value, dot }) => (
                  <DropdownMenuItem key={value} disabled={value === currentStatus} onClick={() => onChangeStatus(value)}>
                    <span className={cn('w-2 h-2 rounded-full mr-2', dot)} /> {value}
                  </DropdownMenuItem>
                ))}
              </DropdownMenuContent>
            </DropdownMenu>
            <Button variant="ghost" size="sm" onClick={onDelete} className={cn(BTN, 'text-destructive hover:text-destructive')}>
              <Trash2 className={ICON} /> Delete
            </Button>
            <span className="w-px h-4 bg-border mx-1" />
            <Button variant="ghost" size="icon" onClick={onClose} aria-label="Clear selection" title="Clear selection" className="h-7 w-7 rounded-full text-muted-foreground">
              <X className={ICON} />
            </Button>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}