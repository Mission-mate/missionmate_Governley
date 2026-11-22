/**
 * Opacity-only entrance motion for pages and tab panels.
 *
 * - Pages fade in once, when their initial data is ready. From the first frame of
 *   a new route the page is held (`data-page-pending`: hidden, except for its
 *   loaders, which stay visible). It is released — page fade and data-list slides
 *   together — once no query the page subscribes to is still on its first fetch
 *   and no standard three-dot loader (LoaderOne, `data-loader`) remains inside it.
 *   A revisit with cached data is ready on the first check, so it enters at once;
 *   later refetches never hold or replay the entrance.
 * - Page tab panels fade in when a tab (`role="tab"`) is selected. If the new panel
 *   shows a loader first, the fade waits for the content that replaces it.
 *   A panel marked `data-entrance-panel` is handed over like a new page instead:
 *   while it loads only its loader shows, then the whole panel fades in once,
 *   together with its data-list slide.
 *   Slide panes are not entrance roots, so tabs inside view/edit panes switch
 *   instantly with no observers attached.
 *
 * Uses the Web Animations API with no fill, so nothing is left on the element
 * afterwards and ordinary re-renders (typing, saving) never replay it.
 * Data lists keep their own CSS slide (`content-enter` in index.css), held
 * until the page is ready so both motions start together.
 */
const FADE = [{ opacity: 0 }, { opacity: 1 }];
const TIMING = { duration: 360, easing: 'ease-out' };
const LOADER = '[data-loader]';
const PANEL = '[data-entrance-panel]';
// Safety net: never keep a page held longer than this, even if a request hangs.
const MAX_WAIT_MS = 8000;

export const reducedMotion = () => window.matchMedia('(prefers-reduced-motion: reduce)').matches;

function fade(elements) {
  if (reducedMotion()) return;
  elements.forEach((el) => el.animate?.(FADE, TIMING));
}

/**
 * While `root` is pending, data lists inside it hold their CSS slide at the first
 * frame (see `[data-entrance-pending]` in index.css), so a table that loads before
 * the rest of the page starts sliding in the same frame as the page fade.
 * Counted, so overlapping page and tab waits release only when both finish.
 */
function holdLists(root) {
  root.dataset.entrancePending = String(Number(root.dataset.entrancePending || 0) + 1);
  let released = false;
  return () => {
    if (released) return;
    released = true;
    const n = Number(root.dataset.entrancePending || 1) - 1;
    if (n > 0) root.dataset.entrancePending = String(n);
    else delete root.dataset.entrancePending;
  };
}

/** Watches `root` until it holds no loader, then calls `onReady(mutationRecords)` once. */
function whenReady(root, onReady) {
  const release = holdLists(root);
  const obs = new MutationObserver((records) => {
    if (root.querySelector(LOADER)) return;
    stop();
    onReady(records);
  });
  // Safety net: a wait that never settles still completes, so nothing stays held.
  const timer = setTimeout(() => { stop(); onReady([]); }, MAX_WAIT_MS);
  function stop() { obs.disconnect(); clearTimeout(timer); release(); }
  obs.observe(root, { childList: true, subtree: true });
}

/** True while any query a mounted component is subscribed to is still on its first fetch. */
const initialFetchInFlight = (queryCache) => queryCache.getAll().some((q) =>
  q.state.status === 'pending' && q.state.fetchStatus === 'fetching' && q.getObserversCount() > 0);

/**
 * Holds the page wrapper from its first painted frame. Call in a layout effect.
 * Returns `{ reveal, release }`, or null when reduced motion is preferred
 * (the page then renders as-is, with no hold and no fade).
 */
export function holdPage(root) {
  if (reducedMotion()) return null;
  root.dataset.pagePending = '';
  const releaseLists = holdLists(root);
  let done = false;
  const release = () => {
    if (done) return;
    done = true;
    delete root.dataset.pagePending;
    releaseLists();
  };
  return { release, reveal: () => { if (done) return; release(); fade([root]); } };
}

/**
 * Calls `onReady` once the page's initial load is complete: no initial query
 * fetch in flight and no loader in `root`. Call in a passive effect, after the
 * page's queries have subscribed. Checks are taken on the next frame after any
 * DOM or query change, so the render that follows a resolved query has committed.
 * Returns a stop function.
 */
export function whenPageReady(root, queryCache, onReady) {
  let frame = 0;
  let stopped = false;
  const ready = () => !root.querySelector(LOADER) && !initialFetchInFlight(queryCache);
  const finish = () => { stop(); onReady(); };
  const check = () => { frame = 0; if (ready()) finish(); };
  const schedule = () => { if (!frame && !stopped) frame = requestAnimationFrame(check); };

  const obs = new MutationObserver(schedule);
  obs.observe(root, { childList: true, subtree: true });
  const unsubscribe = queryCache.subscribe(schedule);
  const timer = setTimeout(finish, MAX_WAIT_MS);
  function stop() {
    stopped = true;
    obs.disconnect();
    unsubscribe();
    clearTimeout(timer);
    cancelAnimationFrame(frame);
  }

  if (ready()) finish();
  return stop;
}

/** Top-level elements inserted by these mutations, excluding the tab bar's own changes. */
function insertedPanels(records, tabList) {
  const nodes = [];
  records.forEach((r) => r.addedNodes.forEach((n) => {
    if (n.nodeType !== 1 || !n.isConnected) return;
    if (tabList.contains(n) || n.contains(tabList)) return;
    nodes.push(n);
  }));
  return nodes.filter((n) => !nodes.some((other) => other !== n && other.contains(n)));
}

/** Arms a fade for the panel a tab click is about to render. */
export function armTabFade(tab) {
  if (tab.getAttribute('aria-selected') === 'true' || tab.disabled) return;
  const root = tab.closest('[data-entrance-root]');
  if (!root) return;
  const tabList = tab.closest('[role="tablist"]') || tab;
  const path = window.location.pathname;
  let waiting = false;

  const obs = new MutationObserver((records) => {
    obs.disconnect();
    // A tab that navigates to a new route is covered by the page fade.
    if (window.location.pathname !== path) return;
    const panels = insertedPanels(records, tabList);
    if (panels.some((n) => n.matches(LOADER) || n.querySelector(LOADER))) {
      waiting = true;
      // Marked panels are held behind their loader (same rule as a pending page), then fade in whole.
      const held = reducedMotion() ? [] : panels.filter((n) => n.matches(PANEL));
      held.forEach((n) => { n.dataset.pagePending = ''; });
      whenReady(root, (later) => {
        held.forEach((n) => { delete n.dataset.pagePending; });
        fade(held.length ? held : insertedPanels(later, tabList));
      });
      return;
    }
    fade(panels);
  });
  obs.observe(root, { childList: true, subtree: true });
  // The selection commits synchronously after the click; disarm if nothing rendered.
  requestAnimationFrame(() => { if (!waiting) obs.disconnect(); });
}