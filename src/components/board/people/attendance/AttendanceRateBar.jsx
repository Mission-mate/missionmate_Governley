import React from 'react';
import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';

/** Shared attendance rate bar — used by the table rows and the view pane. */
export default function AttendanceRateBar({ rate, goodThreshold = 75, atRiskThreshold = 50, index = 0, fullWidth = false }) {
  const color = rate >= goodThreshold ? 'bg-green-500' : rate >= atRiskThreshold ? 'bg-amber-500' : 'bg-destructive';
  const text = rate >= goodThreshold ? 'text-green-600 dark:text-green-400' : rate >= atRiskThreshold ? 'text-amber-600 dark:text-amber-400' : 'text-destructive';
  return (
    <div className="flex items-center gap-2">
      <div className={cn('flex-1 h-2 rounded-full bg-muted overflow-hidden', !fullWidth && 'max-w-[120px]')}>
        <motion.div
          className={cn('h-full rounded-full', color)}
          initial={{ width: 0 }}
          animate={{ width: `${rate}%` }}
          transition={{ duration: 0.6, delay: 0.15 + index * 0.06, ease: 'easeOut' }} />
      </div>
      <span className={cn('text-sm font-semibold w-10 text-right', text)}>{rate}%</span>
    </div>
  );
}