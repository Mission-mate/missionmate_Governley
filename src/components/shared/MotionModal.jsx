import React from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import CloseButton from '@/components/shared/CloseButton';
import OverlayErrorBoundary from '@/components/shared/states/OverlayErrorBoundary';
import { cn } from '@/lib/utils';
import { useEscapeClose } from '@/lib/unsavedChanges/escapeStack';

/**
 * Shared modal chrome matching the "Add New Grant" modal:
 * rounded-2xl card, header with close icon, scrollable body,
 * divided footer, and consistent entry/exit animation.
 */
export default function MotionModal({ isOpen, onClose, title, children, footer, maxWidth = 'max-w-2xl' }) {
  useEscapeClose(isOpen, onClose);
  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[110] flex items-center justify-center p-4">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.15 }}
            className="absolute inset-0 bg-black/40"
            onClick={onClose}
          />
          <motion.div
            initial={{ opacity: 0, scale: 0.97, y: 8 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.97, y: 8 }}
            transition={{ duration: 0.18, ease: [0.16, 1, 0.3, 1] }}
            className={cn('relative z-10 bg-white rounded-2xl shadow-2xl w-full max-h-[90vh] flex flex-col', maxWidth)}
          >
            {/* Header */}
            <div className="flex items-center justify-between px-6 pt-6 pb-4 shrink-0">
              <h2 className="text-xl font-bold text-foreground flex items-center gap-2">{title}</h2>
              <CloseButton onClick={onClose} />
            </div>

            {/* Body */}
            <div className="flex-1 overflow-y-auto px-6 pb-4">
              <OverlayErrorBoundary onClose={onClose}>{children}</OverlayErrorBoundary>
            </div>

            {/* Footer */}
            {footer && (
              <div className="flex items-center justify-between px-6 py-4 border-t border-border shrink-0">
                {footer}
              </div>
            )}
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}