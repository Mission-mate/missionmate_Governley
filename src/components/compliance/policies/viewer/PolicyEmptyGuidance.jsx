import React from 'react';
import { motion } from 'framer-motion';
import { FileText } from 'lucide-react';

/** Calm empty state shown when no readable section content exists. */
export default function PolicyEmptyGuidance({ message }) {
  return (
    <div className="flex flex-1 items-center justify-center px-10 py-14">
      <motion.div initial={{ opacity: 0, y: 5 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5, ease: 'easeOut', delay: 0.08 }} className="max-w-[390px] text-center">
        <span className="mx-auto mb-[18px] grid h-12 w-12 place-items-center rounded-[14px] border border-border bg-muted/40 text-muted-foreground"><FileText className="h-[22px] w-[22px]" strokeWidth={1.5} /></span>
        <p className="text-sm leading-7 text-muted-foreground">{message}</p>
      </motion.div>
    </div>
  );
}