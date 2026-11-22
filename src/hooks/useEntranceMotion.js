import { useEffect, useLayoutEffect, useRef } from 'react';
import { useLocation } from 'react-router-dom';
import { useQueryClient } from '@tanstack/react-query';
import { holdPage, whenPageReady, armTabFade } from '@/lib/entranceMotion';
import { watchCountUps } from '@/lib/countUp';

/**
 * Wires the opacity-only page and tab-panel entrances (see lib/entranceMotion).
 * `pageRef` wraps the routed page content. Runs on pathname changes only, so
 * query-string updates and re-renders never replay the page fade.
 */
export default function useEntranceMotion(pageRef) {
  const { pathname } = useLocation();
  const queryCache = useQueryClient().getQueryCache();
  const holdRef = useRef(null);

  // Layout effect: the new page is held before its first frame paints.
  useLayoutEffect(() => {
    const hold = holdPage(pageRef.current);
    holdRef.current = hold;
    return () => hold?.release();
  }, [pathname, pageRef]);

  // Passive effect: runs after the page's queries have subscribed and started
  // fetching, so the initial-load signal reflects the page's real loading state.
  useEffect(() => {
    const hold = holdRef.current;
    if (!hold) return undefined;
    return whenPageReady(pageRef.current, queryCache, hold.reveal);
  }, [pathname, pageRef, queryCache]);

  // Summary-card numbers count up once as they mount (see lib/countUp).
  useLayoutEffect(() => watchCountUps(pageRef.current), [pageRef]);

  useEffect(() => {
    // Capture phase runs before React's own click handlers commit the new tab.
    const onClick = (e) => {
      const tab = e.target.closest?.('[role="tab"]');
      if (tab) armTabFade(tab);
    };
    document.addEventListener('click', onClick, true);
    return () => document.removeEventListener('click', onClick, true);
  }, []);
}