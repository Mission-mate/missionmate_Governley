import React from 'react';
import { X, Eye, Pencil, Trash2, CheckCircle, Layers } from 'lucide-react';
import { cn } from '@/lib/utils';
import FloatingBarMotion from '@/components/shared/FloatingBarMotion';
import BulkValueMenu from './BulkValueMenu';

/** Floating selection bar for linked WHS records: View / Edit (single), Change Status, Change Stage, Delete. */
export default function LinkedBulkBar({ count, statuses, stages, onView, onEdit, onStatusChange, onStageChange, onDelete, onClear, processing }) {
  const btn = cn('flex items-center gap-2 h-8 px-3 rounded-md text-sm font-medium text-foreground hover:bg-muted transition-colors', processing && 'opacity-50 pointer-events-none');

  return (
    <FloatingBarMotion show={count > 0}>
      <div className="flex items-center gap-1 rounded-full border border-border bg-card shadow-lg px-3 py-2">
        <div className="flex items-center gap-2 pl-2 pr-3 border-r border-border">
          <span className="flex items-center justify-center min-w-6 h-6 px-1.5 rounded-full bg-primary text-primary-foreground text-xs font-semibold">{count}</span>
          <span className="text-sm font-medium text-foreground">selected</span>
        </div>
        {count === 1 && (
          <>
            <button onClick={onView} className={btn}><Eye className="w-4 h-4" /> View</button>
            <button onClick={onEdit} className={btn}><Pencil className="w-4 h-4" /> Edit</button>
          </>
        )}
        <BulkValueMenu icon={CheckCircle} label="Change Status" values={statuses} onPick={onStatusChange} className={btn} />
        {stages && <BulkValueMenu icon={Layers} label="Change Stage" values={stages} onPick={onStageChange} className={btn} />}
        <button onClick={onDelete} className={cn(btn, 'text-destructive hover:bg-destructive/10')}><Trash2 className="w-4 h-4" /> Delete</button>
        <button onClick={onClear} aria-label="Clear selection" className="h-8 w-8 inline-flex items-center justify-center rounded-md text-muted-foreground hover:bg-muted hover:text-foreground transition-colors">
          <X className="w-4 h-4" />
        </button>
      </div>
    </FloatingBarMotion>
  );
}