import React from 'react';
import { motion } from 'framer-motion';

/**
 * Horizontal bar list where each skill name sits directly beneath its own bar.
 * entries: [{ id, name, value }]
 */
export default function SkillBarList({ entries = [], barClass = 'bg-[hsl(var(--chart-1))]' }) {
  if (entries.length === 0) {
    return (
      <div className="h-64 flex items-center justify-center text-sm text-muted-foreground">
        No skills defined yet.
      </div>
    );
  }

  const max = Math.max(1, ...entries.map((e) => e.value));

  return (
    <div className="space-y-3">
      {entries.map((entry, i) => {
        const width = `${Math.max((entry.value / max) * 100, entry.value > 0 ? 4 : 0)}%`;
        return (
          <motion.div
            key={entry.id}
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3, delay: i * 0.06 }}
          >
            <div className="flex items-center gap-3">
              <div className="flex-1 h-3 rounded-full bg-muted overflow-hidden">
                <motion.div
                  className={`h-full rounded-full ${barClass}`}
                  initial={{ width: 0 }}
                  animate={{ width }}
                  transition={{ duration: 0.6, delay: i * 0.06, ease: 'easeOut' }}
                />
              </div>
              <span className="w-6 text-right text-sm font-bold text-foreground shrink-0">{entry.value}</span>
            </div>
            <span className="block mt-0.5 text-xs font-normal text-[hsl(var(--popover-foreground))]">
              {entry.name}
            </span>
          </motion.div>
        );
      })}
    </div>
  );
}