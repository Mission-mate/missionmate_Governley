import React, { useState, useRef, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { Eye, Pencil, Trash2, X, RefreshCw, ChevronDown } from 'lucide-react';
import { AnimatePresence, motion } from 'framer-motion';
import { Button } from '@/components/ui/button';

const STATUS_OPTIONS = ['Open', 'Closed'];

/**
 * Floating action bar for the Risk Register.
 * Single selection: View · Edit · Change Status · Delete
 * Multiple:                      Change Status · Delete
 */
export default function RiskBulkBar({ count, onView, onEdit, onChangeStatus, onDelete, onClear }) {
  const single = count === 1;
  const [statusOpen, setStatusOpen] = useState(false);
  const ref = useRef(null);

  useEffect(() => {
    const handler = (e) => { if (ref.current && !ref.current.contains(e.target)) setStatusOpen(false); };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  useEffect(() => { setStatusOpen(false); }, [count]);

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

            <div className="relative" ref={ref}>
              <Button variant="ghost" size="sm" onClick={() => setStatusOpen((o) => !o)} className="h-8 gap-2 text-sm">
                <RefreshCw className="w-4 h-4" /> Change Status <ChevronDown className="w-3.5 h-3.5" />
              </Button>
              {statusOpen && (
                <div className="animate-dropdown-enter absolute bottom-full mb-2 left-0 w-36 rounded-lg border border-border bg-popover shadow-lg py-1 z-10">
                  {STATUS_OPTIONS.map((opt) => (
                    <button
                      key={opt}
                      onClick={() => { setStatusOpen(false); onChangeStatus(opt); }}
                      className="w-full px-3 py-2 text-sm text-left hover:bg-muted/60 transition-colors"
                    >
                      {opt}
                    </button>
                  ))}
                </div>
              )}
            </div>

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