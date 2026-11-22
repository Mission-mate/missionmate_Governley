import React from 'react';
import { createPortal } from 'react-dom';
import { AnimatePresence, motion } from 'framer-motion';

/** Shared entry/exit animation for floating action bars (matches Work Plan items bar). */
export default function FloatingBarMotion({ show, children }) {
  return createPortal(
    <AnimatePresence>
      {show && (
        <motion.div
          initial={{ opacity: 0, x: '-50%', y: 24 }}
          animate={{ opacity: 1, x: '-50%', y: 0 }}
          exit={{ opacity: 0, x: '-50%', y: 24 }}
          transition={{ duration: 0.18 }}
          className="fixed bottom-6 left-1/2 z-50"
          style={{ maxWidth: 'calc(100vw - 48px)' }}
        >
          {children}
        </motion.div>
      )}
    </AnimatePresence>,
    document.body
  );
}