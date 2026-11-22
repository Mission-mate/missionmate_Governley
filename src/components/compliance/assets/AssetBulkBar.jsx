import React from 'react';
import { createPortal } from 'react-dom';
import { Download, Eye, Pencil, Trash2, X } from 'lucide-react';
import { AnimatePresence, motion } from 'framer-motion';
import { Button } from '@/components/ui/button';
import BulkStatusMenu from './BulkStatusMenu';

const STATUS_OPTIONS = [
  { name: 'Active', dot: 'bg-green-500' },
  { name: 'Disposed', dot: 'bg-red-500' },
];

/** Floating action bar for registers: View / Edit (single) · Change Status (when onChangeStatus) · Delete. */
export default function AssetBulkBar({ count, statusOptions = STATUS_OPTIONS, onView, onEdit, onChangeStatus, onExport, onDelete, onClear, statusLabel = 'Change Status' }) {
  return createPortal(
    <AnimatePresence>
      {count > 0 && (
        <motion.div
          initial={{ opacity: 0, x: '-50%', y: 24 }}
          animate={{ opacity: 1, x: '-50%', y: 0 }}
          exit={{ opacity: 0, x: '-50%', y: 24 }}
          transition={{ duration: 0.18 }}
          className="fixed bottom-6 left-1/2 z-50 max-w-[calc(100vw-48px)]"
        >
          <div className="flex items-center gap-1 rounded-full border border-border bg-card shadow-lg px-3 py-2">
            <div className="flex items-center gap-2 pl-2 pr-3 border-r border-border">
              <span className="flex items-center justify-center min-w-6 h-6 px-1.5 rounded-full bg-primary text-primary-foreground text-xs font-semibold">{count}</span>
              <span className="text-sm font-medium text-foreground">selected</span>
            </div>
            {count === 1 && (
              <Button variant="ghost" size="sm" onClick={onView} className="h-8 gap-2 text-sm">
                <Eye className="w-4 h-4" /> View
              </Button>
            )}
            {count === 1 && onEdit && (
              <Button variant="ghost" size="sm" onClick={onEdit} className="h-8 gap-2 text-sm">
                <Pencil className="w-4 h-4" /> Edit
              </Button>
            )}
            {onChangeStatus && <BulkStatusMenu label={statusLabel} options={statusOptions} onChange={onChangeStatus} resetKey={count} />}
            {count === 1 && onExport && (
              <Button variant="ghost" size="sm" onClick={onExport} className="h-8 gap-2 text-sm">
                <Download className="w-4 h-4" /> Export
              </Button>
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