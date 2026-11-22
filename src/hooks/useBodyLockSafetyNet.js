import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';

// Selectors that indicate a Radix overlay is legitimately open right now.
const OPEN_OVERLAY = [
  '[role="dialog"][data-state="open"]',
  '[data-radix-popper-content-wrapper] [data-state="open"]',
].join(', ');

/**
 * Body-lock safety net.
 *
 * Radix overlays (Dialog / Sheet / AlertDialog / Popover / Select) lock the
 * page by writing inline styles onto <body> (pointer-events: none, overflow,
 * padding/margin-right) plus a data-scroll-locked attribute. If an overlay
 * unmounts mid-interaction — a render error, an interrupted drag, a list
 * re-render while a menu is open — that lock can be left behind and every
 * click lands on the invisible lock layer until a hard refresh.
 *
 * This hook clears those stranded styles on route change and on tab refocus,
 * but ONLY when no overlay is currently open, so active modals keep their
 * scroll lock and pointer-event behaviour exactly as before.
 */
export default function useBodyLockSafetyNet() {
  const { pathname } = useLocation();

  useEffect(() => {
    const release = () => {
      if (document.querySelector(OPEN_OVERLAY)) return;
      const { style } = document.body;
      style.pointerEvents = '';
      style.overflow = '';
      style.paddingRight = '';
      style.marginRight = '';
      document.body.removeAttribute('data-scroll-locked');
      // Radix's modal FocusScope marks every sibling of an overlay portal with
      // `inert` (+ aria-hidden) and relies on its own cleanup to remove them. An
      // interrupted unmount can strand those attributes on #root, making the
      // entire app non-interactive. Release them too.
      for (const el of document.body.children) {
        el.removeAttribute('inert');
        el.removeAttribute('aria-hidden');
      }
    };

    release();

    let releaseQueued = false;
    let frameId = null;
    let cancelled = false;
    const queueRelease = () => {
      if (releaseQueued) return;
      releaseQueued = true;
      queueMicrotask(() => {
        if (cancelled) return;
        frameId = window.requestAnimationFrame(() => {
          releaseQueued = false;
          frameId = null;
          release();
        });
      });
    };

    // Watch body portals and their direct-child accessibility locks. Portal
    // removal is important: it gives us a recovery signal when Radix unmounts
    // before clearing inert/aria-hidden from the application root.
    const observer = new MutationObserver((mutations) => {
      const shouldCheck = mutations.some((mutation) =>
        mutation.type === 'childList' ||
        (mutation.type === 'attributes' && mutation.target.parentElement === document.body)
      );
      if (shouldCheck) queueRelease();
    });
    observer.observe(document.body, {
      childList: true,
      subtree: true,
      attributes: true,
      attributeFilter: ['inert', 'aria-hidden'],
    });

    const onVisibility = () => { if (!document.hidden) release(); };
    document.addEventListener('visibilitychange', onVisibility);
    return () => {
      cancelled = true;
      observer.disconnect();
      if (frameId !== null) window.cancelAnimationFrame(frameId);
      document.removeEventListener('visibilitychange', onVisibility);
    };
  }, [pathname]);
}