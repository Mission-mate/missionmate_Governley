import { useEffect, useRef } from 'react';

/**
 * Escape routing for overlays. Every open SlidePane / ModalOverlay registers its
 * onClose here; one document listener sends Escape only to the most recently
 * opened overlay, so it follows the same guarded close path as the X button.
 */
let stack = [];

const onKeyDown = (e) => {
  if (e.key !== 'Escape' || e.defaultPrevented || stack.length === 0) return;
  // Let open Radix menus/popovers/selects/dialogs handle their own Escape first.
  if (document.querySelector('[data-radix-popper-content-wrapper], [role="dialog"][data-state="open"], [role="alertdialog"][data-state="open"]')) return;
  e.preventDefault();
  stack[stack.length - 1].current?.();
};

export function useEscapeClose(isOpen, onClose) {
  const ref = useRef(onClose);
  ref.current = onClose;
  useEffect(() => {
    if (!isOpen) return;
    if (stack.length === 0) document.addEventListener('keydown', onKeyDown);
    stack = [...stack, ref];
    return () => {
      stack = stack.filter((r) => r !== ref);
      if (stack.length === 0) document.removeEventListener('keydown', onKeyDown);
    };
  }, [isOpen]);
}