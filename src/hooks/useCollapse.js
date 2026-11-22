import { useEffect, useState } from 'react';

/** Matches the `expand-exit` animation duration in tailwind.config.js. */
const EXIT_MS = 220;

const prefersReducedMotion = () =>
  typeof window !== 'undefined' && !!window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;

/**
 * Keeps collapsible content mounted long enough to play its closing animation.
 * Returns `mounted` (render the content while true) and the animation `className`
 * to apply: slide-down on open, a slightly quicker slide-up on close. Closes
 * instantly when reduced motion is preferred.
 */
export default function useCollapse(open) {
  const [mounted, setMounted] = useState(open);

  useEffect(() => {
    if (open) { setMounted(true); return undefined; }
    if (prefersReducedMotion()) { setMounted(false); return undefined; }
    const timer = setTimeout(() => setMounted(false), EXIT_MS);
    return () => clearTimeout(timer);
  }, [open]);

  const closing = !open && mounted;
  return {
    mounted: open || mounted,
    closing,
    className: closing ? 'animate-expand-exit pointer-events-none' : 'animate-expand-enter',
  };
}