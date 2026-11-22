import React from 'react';
import { Eye, Pencil, Trash2, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import FloatingBarMotion from '@/components/shared/FloatingBarMotion';

/** Floating View / Edit / Delete bar shown when a single row is selected. Omit onDelete to hide Delete. */
export default function SingleRecordActionBar({ open, onView, onEdit, onDelete, onClear }) {
  return (
    <FloatingBarMotion show={open}>
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
        {onDelete && (
          <Button variant="ghost" size="sm" onClick={onDelete} className="h-8 gap-2 text-sm text-destructive hover:text-destructive">
            <Trash2 className="w-4 h-4" /> Delete
          </Button>
        )}
        <Button variant="ghost" size="icon" onClick={onClear} className="h-8 w-8 text-muted-foreground">
          <X className="w-4 h-4" />
        </Button>
      </div>
    </FloatingBarMotion>
  );
}