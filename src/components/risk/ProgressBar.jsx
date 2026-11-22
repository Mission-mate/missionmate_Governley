import React from 'react';
import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';

/**
 * Sleek animated progress bar used across the risk treatment UI.
 * The fill animates in from 0 on mount / whenever the value changes.
 * When `editable` is true the bar itself becomes a slider (draggable handle).
 */
export default function ProgressBar({ value = 0, size = 'sm', showLabel = true, className, editable = false, onChange }) {
  const pct = Math.max(0, Math.min(100, Number(value) || 0));
  const height = size === 'md' ? 'h-2' : 'h-1.5';

  return (
    <div className={cn('flex items-center gap-2 w-full', className)}>
      <div className="relative flex-1 min-w-[40px] flex items-center">
        <div className={cn('w-full rounded-full bg-muted/70 overflow-hidden', height)}>
          <motion.div
            initial={{ width: 0 }}
            animate={{ width: `${pct}%` }}
            transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
            className={cn(
              'h-full rounded-full',
              pct >= 100
                ? 'bg-gradient-to-r from-emerald-400 to-emerald-500'
                : 'bg-gradient-to-r from-primary/70 to-primary'
            )}
          />
        </div>

        {editable && (
          <>
            {/* Draggable handle */}
            <span
              className={cn(
                'absolute top-1/2 -translate-y-1/2 -translate-x-1/2 w-3.5 h-3.5 rounded-full bg-card shadow ring-2 pointer-events-none',
                pct >= 100 ? 'ring-emerald-500' : 'ring-primary'
              )}
              style={{ left: `${pct}%` }}
            />
            <input
              type="range"
              min={0}
              max={100}
              step={5}
              value={pct}
              onChange={(e) => onChange?.(Number(e.target.value))}
              className="absolute inset-0 w-full h-4 opacity-0 cursor-pointer"
            />
          </>
        )}
      </div>

      {showLabel && (
        <span className="text-xs font-medium text-foreground w-9 text-right tabular-nums">{pct}%</span>
      )}
    </div>
  );
}