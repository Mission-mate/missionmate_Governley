/**
 * SlidePane — animated right-side slide-in panel wrapper.
 * Usage:
 *   <SlidePane isOpen={open} onClose={close}>
 *     <div>...panel content...</div>
 *   </SlidePane>
 *
 * Animation standard (all right-side drawers):
 *   open  — slide in from the right + fade in, 300ms ease-in-out
 *   close — slide out to the right + fade out, 300ms ease-in-out
 *
 * Width: every pane shares one standard width, set here (full width on small
 * screens) — panes don't pass a width of their own. The only exception is a
 * pane with a wider mode (an expand toggle, a document preview, a report),
 * which passes just a larger `max-w-*` for that mode; the change animates via
 * the max-width transition.
 *
 * Conditionally-mounted drawers: wrap the conditional render in a parent
 * <AnimatePresence> and give the pane a stable key. SlidePane picks up the
 * parent's presence automatically and defers unmount until the exit animation
 * has finished — no change to mounting or state lifecycle is required.
 *
 * Closing depends only on the pane's own backdrop and panel: the content is
 * cut off from the pane's presence, so nothing rendered inside it (nested
 * panes, modals, animated controls) can keep a closed pane on screen.
 */
import React, { useEffect } from 'react';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence, PresenceContext } from 'framer-motion';
import { usePaneStack } from './usePaneStack';
import { usePanePresence } from './usePanePresence';
import { useEscapeClose } from '@/lib/unsavedChanges/escapeStack';
import OverlayErrorBoundary from '@/components/shared/states/OverlayErrorBoundary';
import { cn } from '@/lib/utils';

const ENTER = { duration: 0.3, ease: 'easeInOut' };
const EXIT = { duration: 0.3, ease: 'easeInOut' };
const INSTANT = { duration: 0.15, ease: 'easeOut' };

export default function SlidePane({ isOpen, onClose, children, className = '', instant = false }) {
  // When rendered inside a parent AnimatePresence, isPresent flips to false on
  // removal — we keep rendering until the exit animation completes.
  const [isPresent, safeToRemove] = usePanePresence();
  const open = isOpen && isPresent;
  // A closed pane has nothing to animate out, so it releases its parent's exit
  // straight away — otherwise the parent never finishes closing and its
  // invisible backdrop stays over the page.
  useEffect(() => {
    if (!isPresent && !isOpen) safeToRemove?.();
  }, [isPresent, isOpen, safeToRemove]);
  const { isTop, depth } = usePaneStack(open);
  useEscapeClose(open, onClose);

  // Per-pane z-index tier: a nested pane (and its backdrop) always paints above
  // its parent, so the child's backdrop covers the parent and click-to-close works.
  const backdropZ = 100 + depth * 2;
  const paneZ = backdropZ + 1;

  if (typeof document === 'undefined') return null;

  return createPortal(
    <AnimatePresence onExitComplete={() => { if (!isPresent) safeToRemove?.(); }}>
      {open && (
        <>
          {/* Backdrop */}
          <motion.div
            key="backdrop"
            className="fixed inset-0 bg-black/40"
            style={{ zIndex: backdropZ }}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.15, ease: 'easeOut' }}
            onClick={onClose}
          />
          {/* Pane */}
          <motion.div
            key="pane"
            className={cn('fixed inset-y-0 right-0 w-full max-w-[616px] transition-[max-width] duration-300 ease-in-out', className)}
            style={{ position: 'fixed', zIndex: paneZ }}
            initial={instant ? { x: 0, opacity: 0 } : { x: '100%', opacity: 0 }}
            animate={{ x: 0, opacity: 1, transition: instant ? INSTANT : ENTER }}
            exit={instant ? { x: 0, opacity: 0, transition: INSTANT } : { x: '100%', opacity: 0, transition: EXIT }}
          >
            <PresenceContext.Provider value={null}>
              <OverlayErrorBoundary onClose={onClose}>{children}</OverlayErrorBoundary>
            </PresenceContext.Provider>
            {/* Dim this pane while another pane is open on top of it */}
            <AnimatePresence>
              {!isTop && (
                <motion.div
                  className="absolute inset-0 bg-black/40 z-[60]"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: 0.15, ease: 'easeOut' }}
                />
              )}
            </AnimatePresence>
          </motion.div>
        </>
      )}
    </AnimatePresence>,
    document.body
  );
}