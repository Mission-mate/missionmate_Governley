import { useEffect, useRef, useState } from 'react';

/**
 * Tracks the stack of currently open slide-in panes so only the most recently
 * opened pane stays fully visible — panes underneath get dimmed.
 */
let stack = [];
const listeners = new Set();
const notify = () => listeners.forEach((l) => l());

/** Number of panes currently open — used to layer guard dialogs above the topmost pane. */
export const openPaneCount = () => stack.length;

export function usePaneStack(isOpen) {
  const idRef = useRef(`pane_${Math.random().toString(36).slice(2)}`);
  const [, force] = useState(0);

  useEffect(() => {
    const l = () => force((n) => n + 1);
    listeners.add(l);
    return () => listeners.delete(l);
  }, []);

  useEffect(() => {
    if (!isOpen) return;
    const id = idRef.current;
    stack = [...stack, id];
    notify();
    return () => {
      stack = stack.filter((i) => i !== id);
      notify();
    };
  }, [isOpen]);

  if (!isOpen) return { isTop: true, depth: 0 };
  const depth = stack.indexOf(idRef.current);
  return {
    isTop: stack[stack.length - 1] === idRef.current,
    // Depth in the stack — drives per-pane z-index tiers so a child pane and its
    // backdrop always paint above the parent pane.
    depth: depth === -1 ? Math.max(stack.length - 1, 0) : depth,
  };
}