import React from 'react';
import { Trash2, Pencil } from 'lucide-react';
import { Button } from '@/components/ui/button';

export default function RowActions({ onEdit, onDelete }) {
  return (
    <div className="flex items-center justify-end gap-1">
      <Button
        variant="ghost"
        size="icon"
        className="h-8 w-8 text-muted-foreground hover:text-primary hover:bg-primary/10 transition-colors"
        onClick={(e) => { e.stopPropagation(); onEdit(); }}
        title="Edit row"
      >
        <Pencil className="w-4 h-4" />
      </Button>
      <Button
        variant="ghost"
        size="icon"
        className="h-8 w-8 text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-colors"
        onClick={(e) => { e.stopPropagation(); onDelete(); }}
        title="Delete row"
      >
        <Trash2 className="w-4 h-4" />
      </Button>
    </div>
  );
}