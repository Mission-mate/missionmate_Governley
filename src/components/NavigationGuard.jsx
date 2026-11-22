import { useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import usePageLeaveGuard from '@/hooks/usePageLeaveGuard';
import { hasDirtyEditors, subscribeDirty } from '@/lib/unsavedChanges/dirtyRegistry';

const SENTINEL = '__unsavedGuard';

/**
 * App-level navigation guard. While any editor is dirty:
 *  - same-origin link clicks are held behind the Discard prompt
 *  - browser back/forward is caught via a sentinel history entry
 */
export default function NavigationGuard() {
  const navigate = useNavigate();
  const leave = usePageLeaveGuard();
  const leaveRef = useRef(leave);
  leaveRef.current = leave;
  const ignorePop = useRef(false);

  // Link clicks (sidebar, rail, breadcrumbs, any in-app <a>).
  useEffect(() => {
    const onClick = (e) => {
      if (!hasDirtyEditors() || e.defaultPrevented || e.button !== 0 || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return;
      const a = e.target.closest?.('a[href]');
      if (!a || a.target === '_blank' || a.hasAttribute('download')) return;
      const url = new URL(a.href, window.location.href);
      if (url.origin !== window.location.origin) return;
      const to = url.pathname + url.search + url.hash;
      if (to === window.location.pathname + window.location.search + window.location.hash) return;
      e.preventDefault();
      e.stopPropagation();
      leaveRef.current.guard(() => navigate(to));
    };
    document.addEventListener('click', onClick, true);
    return () => document.removeEventListener('click', onClick, true);
  }, [navigate]);

  // Browser back/forward: park a sentinel entry on top while dirty.
  useEffect(() => {
    const pushSentinel = () => {
      if (!window.history.state?.[SENTINEL]) {
        window.history.pushState({ ...window.history.state, [SENTINEL]: true }, '');
      }
    };
    const onDirtyChange = (isDirty) => {
      if (isDirty) pushSentinel();
      else if (window.history.state?.[SENTINEL]) { ignorePop.current = true; window.history.back(); }
    };
    const onPop = () => {
      if (ignorePop.current) { ignorePop.current = false; return; }
      if (!hasDirtyEditors()) return;
      // We just left the sentinel; restore it and ask.
      pushSentinel();
      leaveRef.current.guard(() => { ignorePop.current = true; window.history.go(-2); });
    };
    if (hasDirtyEditors()) pushSentinel();
    const unsub = subscribeDirty(onDirtyChange);
    window.addEventListener('popstate', onPop);
    return () => { unsub(); window.removeEventListener('popstate', onPop); };
  }, []);

  return leave.dialog;
}