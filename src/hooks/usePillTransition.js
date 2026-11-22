import { useCallback, useState } from 'react';
import { useReducedMotion } from 'framer-motion';

export const PILL_SPRING = { type: 'spring', stiffness: 500, damping: 40, mass: 1 };
const INSTANT = { duration: 0 };

/**
 * Transition for capsule-switcher active pills (shared layoutId).
 * The pill is placed instantly on mount and on any non-user layout change
 * (data loading, count updates, page entrance). Once the user interacts with
 * the switcher, tab changes spring. Always instant under reduced motion.
 */
export default function usePillTransition() {
  const reduceMotion = useReducedMotion();
  const [armed, setArmed] = useState(false);
  const arm = useCallback(() => setArmed(true), []);
  return { transition: armed && !reduceMotion ? PILL_SPRING : INSTANT, arm, reduceMotion };
}