import React from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import CopilotIcon from './CopilotIcon';

/** Frosted cover over the composer while a message is being sent; Genie blinks quickly on it. */
export default function CopilotSendingVeil({ copilot, show }) {
  return (
    <AnimatePresence>
      {show && (
        <motion.div
          role="status"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.2, ease: 'easeOut' }}
          className="absolute inset-0 flex items-center justify-center gap-2.5 bg-card/60 backdrop-blur-md dark:bg-background/60"
        >
          <CopilotIcon copilot={copilot} size={32} className="genie-busy" />
          <span className="text-sm font-medium text-foreground">Sending…</span>
        </motion.div>
      )}
    </AnimatePresence>
  );
}