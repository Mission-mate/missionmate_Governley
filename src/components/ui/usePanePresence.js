import { useCallback, useContext, useEffect, useId } from 'react';
import { PresenceContext } from 'framer-motion';

/**
 * Presence of a pane rendered inside a parent <AnimatePresence>:
 * returns [isPresent, safeToRemove], or [true, null] when there is no parent.
 *
 * Framer Motion's own usePresence never withdraws its registration, so a pane
 * that unmounted while its parent stayed open kept that parent waiting forever
 * on close — leaving an invisible backdrop over the page. This one unregisters
 * on unmount.
 */
export function usePanePresence() {
  const context = useContext(PresenceContext);
  const id = useId();
  // The parent's registry is stable for its lifetime, so registering once is enough.
  useEffect(() => context?.register(id), []); // eslint-disable-line react-hooks/exhaustive-deps

  const onExitComplete = context?.onExitComplete;
  const safeToRemove = useCallback(() => onExitComplete?.(id), [id, onExitComplete]);

  return context && !context.isPresent && onExitComplete ? [false, safeToRemove] : [true, null];
}