/**
 * GrantObligationBulkBar — floating capsule selection bar for a grant's obligations.
 * View / Edit (single selection only), Change Status, Delete.
 */
import React, { useState, useRef, useEffect } from 'react';
import { X, Eye, Pencil, Trash2, ChevronDown, CheckCircle } from 'lucide-react';
import { cn } from '@/lib/utils';
import FloatingBarMotion from '@/components/shared/FloatingBarMotion';

const STATUS_OPTIONS = [
  { value: 'not_started', label: 'Not Started', color: 'bg-gray-400' },
  { value: 'in_progress', label: 'In Progress', color: 'bg-yellow-400' },
  { value: 'complete', label: 'Completed', color: 'bg-green-500' },
];

export default function GrantObligationBulkBar({ count, onView, onEdit, onStatusChange, onDelete, onClear, processing = false }) {
  const [showStatus, setShowStatus] = useState(false);
  const ref = useRef();

  useEffect(() => {
    const handler = (e) => { if (ref.current && !ref.current.contains(e.target)) setShowStatus(false); };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const btn = cn(
    'flex items-center gap-2 h-8 px-3 rounded-md text-sm font-medium text-foreground hover:bg-muted transition-colors',
    processing && 'opacity-50 pointer-events-none'
  );

  return (
    <FloatingBarMotion show={count > 0}>
      <div className="flex items-center gap-1 rounded-full border border-border bg-card shadow-lg px-3 py-2">
        <div className="flex items-center gap-2 pl-2 pr-3 border-r border-border">
          <span className="flex items-center justify-center min-w-6 h-6 px-1.5 rounded-full bg-primary text-primary-foreground text-xs font-semibold">{count}</span>
          <span className="text-sm font-medium text-foreground">selected</span>
        </div>

        {count === 1 && (
          <>
            <button onClick={onView} disabled={processing} className={btn}><Eye className="w-4 h-4" /> View</button>
            <button onClick={onEdit} disabled={processing} className={btn}><Pencil className="w-4 h-4" /> Edit</button>
          </>
        )}

        <div ref={ref} className="relative">
          <button onClick={() => setShowStatus(v => !v)} disabled={processing} className={btn}>
            <CheckCircle className="w-4 h-4" />
            Change Status
            <ChevronDown className="w-3.5 h-3.5" />
          </button>
          {showStatus && (
            <div className="animate-dropdown-enter absolute bottom-full mb-2 left-0 bg-white border border-border rounded-xl shadow-xl py-1.5 min-w-[160px]">
              {STATUS_OPTIONS.map(opt => (
                <button
                  key={opt.value}
                  onClick={() => { onStatusChange(opt.value); setShowStatus(false); }}
                  className="flex items-center gap-2.5 w-full px-4 py-2 text-sm text-foreground hover:bg-muted/40 transition-colors"
                >
                  <span className={cn('w-2.5 h-2.5 rounded-full', opt.color)} />
                  {opt.label}
                </button>
              ))}
            </div>
          )}
        </div>

        <button onClick={onDelete} disabled={processing} className={cn(btn, 'text-destructive hover:bg-destructive/10')}>
          <Trash2 className="w-4 h-4" /> Delete
        </button>

        <button onClick={onClear} className="h-8 w-8 inline-flex items-center justify-center rounded-md text-muted-foreground hover:bg-accent hover:text-accent-foreground transition-colors">
          <X className="w-4 h-4" />
        </button>
      </div>
    </FloatingBarMotion>
  );
}