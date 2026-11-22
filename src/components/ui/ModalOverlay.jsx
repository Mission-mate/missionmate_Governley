/**
 * ModalOverlay — animated center-screen modal wrapper.
 * Usage:
 *   <ModalOverlay isOpen={open} onClose={close}>
 *     <div>...modal content...</div>
 *   </ModalOverlay>
 */
import React from 'react';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { useEscapeClose } from '@/lib/unsavedChanges/escapeStack';
import OverlayErrorBoundary from '@/components/shared/states/OverlayErrorBoundary';

export default function ModalOverlay({ isOpen, onClose, children, className = '', overlayClassName = '', zIndex }) {
  // Modals always stack above slide-over panes (SlidePane uses z-[100]/z-[101]).
  // Any z-* passed by a caller is dropped so the modal can never end up behind a pane.
  useEscapeClose(isOpen, onClose);
  const extraClasses = overlayClassName.split(' ').filter((c) => c && !c.startsWith('z-')).join(' ');
  if (typeof document === 'undefined') return null;
  // Portaled to <body> so the fixed-position panel escapes any transformed
  // ancestor — an open SlidePane leaves a transform on its pane element, which
  // would otherwise become the containing block and trap this modal inside it.
  return createPortal(
    <AnimatePresence>
      {isOpen && (
        <div className={`fixed inset-0 flex items-center justify-center p-4 z-[110] ${extraClasses}`} style={zIndex ? { zIndex } : undefined}>
          {/* Backdrop */}
          <motion.div
            key="backdrop"
            className="absolute inset-0 bg-black/40"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.15, ease: 'easeOut' }}
            onClick={onClose}
          />
          {/* Panel */}
          <motion.div
            key="panel"
            className={`relative z-10 ${className}`}
            initial={{ opacity: 0, scale: 0.97, y: 6 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.97, y: 6 }}
            transition={{ duration: 0.15, ease: [0.16, 1, 0.3, 1] }}
          >
            <OverlayErrorBoundary onClose={onClose}>{children}</OverlayErrorBoundary>
          </motion.div>
        </div>
      )}
    </AnimatePresence>,
    document.body
  );
}