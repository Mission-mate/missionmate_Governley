import React from 'react';
import { createPortal } from 'react-dom';
import { Eye, Pencil, Trash2, X, Layers } from 'lucide-react';
import { AnimatePresence, motion } from 'framer-motion';
import { Button } from '@/components/ui/button';
import StatusChangeMenu from './StatusChangeMenu';

/**
 * Floating action bar for the Action / Controls registers.
 * Single selection: View · Edit · Delete
 * Multiple:                       Delete
 */
export default function RowBulkBar({ count, onView, onEdit, onDelete, onClear, statusOptions, onChangeStatus, stageOptions, onChangeStage }) {
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

            {statusOptions?.length > 0 && onChangeStatus && (
              <StatusChangeMenu options={statusOptions} onChange={onChangeStatus} />
            )}
            {stageOptions?.length > 0 && onChangeStage && (
              <StatusChangeMenu options={stageOptions} onChange={onChangeStage} label="Change Stage" icon={Layers} />
            )}

            {onDelete && (
              <Button variant="ghost" size="sm" onClick={onDelete} className="h-8 gap-2 text-sm text-destructive hover:text-destructive">
                <Trash2 className="w-4 h-4" /> Delete
              </Button>
            )}
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