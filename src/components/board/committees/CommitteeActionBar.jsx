import React from 'react';
import { createPortal } from 'react-dom';
import { Eye, Pencil, Archive, RotateCcw, Trash2, X } from 'lucide-react';
import { AnimatePresence, motion } from 'framer-motion';
import { Button } from '@/components/ui/button';

/** Floating action bar shown when a single committee card is selected. */
export default function CommitteeActionBar({
  committee,
  onView,
  onEdit,
  onArchive,
  onRestore,
  onDelete,
  onClear
}) {
  const archived = committee?.status === 'archived';
  return createPortal(
    <AnimatePresence>
      {!!committee && (
        <motion.div
          initial={{ opacity: 0, x: '-50%', y: 24 }}
          animate={{ opacity: 1, x: '-50%', y: 0 }}
          exit={{ opacity: 0, x: '-50%', y: 24 }}
          transition={{ duration: 0.18 }}
          className="fixed bottom-6 left-1/2 z-50">
          <div className="flex items-center gap-1 rounded-full border border-border bg-card shadow-lg px-3 py-2">
            <div className="flex items-center gap-2 pl-2 pr-3 border-r border-border">
              <span className="flex items-center justify-center min-w-6 h-6 px-1.5 rounded-full bg-primary text-primary-foreground text-xs font-semibold">1</span>
              <span className="text-sm font-medium text-foreground">selected</span>
            </div>
            <Button variant="ghost" size="sm" onClick={onView} className="h-8 gap-2 text-sm">
              <Eye className="w-4 h-4" /> View
            </Button>
            <Button variant="ghost" size="sm" onClick={onEdit} className="h-8 gap-2 text-sm">
              <Pencil className="w-4 h-4" /> Edit
            </Button>
            {archived ? (
              <Button variant="ghost" size="sm" onClick={onRestore} className="h-8 gap-2 text-sm">
                <RotateCcw className="w-4 h-4" /> Restore
              </Button>
            ) : (
              <Button variant="ghost" size="sm" onClick={onArchive} className="h-8 gap-2 text-sm">
                <Archive className="w-4 h-4" /> Archive
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