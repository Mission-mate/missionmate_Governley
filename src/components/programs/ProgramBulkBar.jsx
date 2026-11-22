import React, { useState } from 'react';
import { createPortal } from 'react-dom';
import { motion } from 'framer-motion';
import { X, Archive, ChevronDown, CheckCircle, Trash2, ExternalLink, Pencil } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { DropdownMenu, DropdownMenuTrigger, DropdownMenuContent, DropdownMenuItem } from '@/components/ui/dropdown-menu';

const STATUS_OPTIONS = [
  { value: 'active', label: 'Active', color: 'bg-green-500' },
  { value: 'completed', label: 'Completed', color: 'bg-blue-500' },
];

/** Floating action bar for selected Program / Project cards — Strategy Register style. */
export default function ProgramBulkBar({ count, onOpen, onEdit, onStatusChange, onArchive, onDelete, onClear, isArchivedTab }) {
  const [menuOpen, setMenuOpen] = useState(false);

  return createPortal(
    <motion.div
      initial={{ opacity: 0, x: '-50%', y: 24 }}
      animate={{ opacity: 1, x: '-50%', y: 0 }}
      transition={{ duration: 0.18 }}
      className="fixed bottom-6 left-1/2 z-50"
      style={{ maxWidth: 'calc(100vw - 48px)' }}
    >
      <div className="flex items-center gap-1 rounded-full border border-border bg-card shadow-lg px-3 py-2">
        <div className="flex items-center gap-2 pl-2 pr-3 border-r border-border">
          <span className="flex items-center justify-center min-w-6 h-6 px-1.5 rounded-full bg-primary text-primary-foreground text-xs font-semibold">{count}</span>
          <span className="text-sm font-medium text-foreground">selected</span>
        </div>

        {onOpen && (
          <Button variant="ghost" size="sm" onClick={onOpen} className="h-8 gap-2 text-sm">
            <ExternalLink className="w-4 h-4" /> Open
          </Button>
        )}
        {onEdit && (
          <Button variant="ghost" size="sm" onClick={onEdit} className="h-8 gap-2 text-sm">
            <Pencil className="w-4 h-4" /> Edit
          </Button>
        )}

        <DropdownMenu open={menuOpen} onOpenChange={setMenuOpen}>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="sm" className="h-8 gap-2 text-sm">
              <CheckCircle className="w-4 h-4" /> Change Status <ChevronDown className="w-3.5 h-3.5" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent side="top" align="start" className="min-w-[160px]">
            {STATUS_OPTIONS.map((opt) => (
              <DropdownMenuItem key={opt.value} onSelect={() => onStatusChange(opt.value)} className="gap-2.5">
                <span className={`w-2.5 h-2.5 rounded-full ${opt.color}`} />
                {opt.label}
              </DropdownMenuItem>
            ))}
          </DropdownMenuContent>
        </DropdownMenu>

        {!isArchivedTab && (
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
    </motion.div>,
    document.body
  );
}