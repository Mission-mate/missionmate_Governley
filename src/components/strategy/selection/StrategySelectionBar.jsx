import React from 'react';
import { createPortal } from 'react-dom';
import { Eye, Pencil, Activity, Move, Trash2, X } from 'lucide-react';
import { AnimatePresence, motion } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { cn } from '@/lib/utils';
import { HEALTH_OPTIONS, healthStyle } from '../level3/health';

/**
 * Floating action bar for selected strategy rows.
 * Single selection: View · Edit · Change Health · Move · Delete
 * Multiple selection: Change Health · Delete
 */
export default function StrategySelectionBar({
  count,
  moveMode,
  onView,
  onEdit,
  onChangeHealth,
  onToggleMove,
  onDelete,
  onClear,
}) {
  const single = count === 1;

  return createPortal(
    <AnimatePresence>
      {count > 0 && (
        <motion.div
          initial={{ opacity: 0, x: '-50%', y: 24 }}
          animate={{ opacity: 1, x: '-50%', y: 0 }}
          exit={{ opacity: 0, x: '-50%', y: 24 }}
          transition={{ duration: 0.18 }}
          className="fixed bottom-6 left-1/2 z-50"
          style={{ width: 'auto', maxWidth: 'calc(100vw - 48px)' }}
        >
          <div className="flex items-center gap-1 rounded-full border border-border bg-card shadow-lg px-3 py-2">
            <div className="flex items-center gap-2 pl-2 pr-3 border-r border-border">
              <span className="flex items-center justify-center min-w-6 h-6 px-1.5 rounded-full bg-primary text-primary-foreground text-xs font-semibold">
                {count}
              </span>
              <span className="text-sm font-medium text-foreground">selected</span>
            </div>

            {single && (
              <>
                <Button variant="ghost" size="sm" onClick={onView} className="h-8 gap-2 text-sm">
                  <Eye className="w-4 h-4" /> View
                </Button>
                <Button variant="ghost" size="sm" onClick={onEdit} className="h-8 gap-2 text-sm">
                  <Pencil className="w-4 h-4" /> Edit
                </Button>
              </>
            )}

            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="sm" className="h-8 gap-2 text-sm">
                  <Activity className="w-4 h-4" /> Change Health
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="center">
                {HEALTH_OPTIONS.map((h) => (
                  <DropdownMenuItem key={h} onClick={() => onChangeHealth(h)}>
                    <span className={cn('font-medium', healthStyle(h).text)}>{h}</span>
                  </DropdownMenuItem>
                ))}
              </DropdownMenuContent>
            </DropdownMenu>

            {single && (
              <Button
                variant="ghost"
                size="sm"
                onClick={onToggleMove}
                className={cn('h-8 gap-2 text-sm', moveMode && 'bg-accent text-accent-foreground')}
              >
                <Move className="w-4 h-4" /> Move
              </Button>
            )}

            <Button variant="ghost" size="sm" onClick={onDelete} className="h-8 gap-2 text-sm text-destructive hover:text-destructive">
              <Trash2 className="w-4 h-4" /> Delete
            </Button>
            <Button variant="ghost" size="icon" onClick={onClear} className="h-8 w-8 text-muted-foreground">
              <X className="w-4 h-4" />
            </Button>
          </div>
        </motion.div>
      )}
    </AnimatePresence>,
    document.body
  );
}