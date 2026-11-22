import React, { useCallback, useEffect, useLayoutEffect, useRef } from 'react';

// Row height in px. Matches the h-10 rows and the h-20 (two-row) spacers below.
const ITEM_H = 40;
// Rows further than this from the centre are invisible and left unpainted.
const REACH = 3;
// A looping wheel repeats its items this many times and rests in the middle copy.
const COPIES = 21;
// How long the wheel must be still before its value is committed.
const SETTLE_MS = 120;

const prefersReducedMotion = () =>
  typeof window !== 'undefined' && window.matchMedia('(prefers-reduced-motion: reduce)').matches;

// Scale and opacity for a row `d` rows away from the centre, interpolated between
// the centre (1.2 / 1), one row out (0.95 / 0.55), two rows out (0.85 / 0.25) and gone.
function rowLook(d) {
  if (d <= 1) return [1.2 - 0.25 * d, 1 - 0.45 * d];
  if (d <= 2) return [0.95 - 0.1 * (d - 1), 0.55 - 0.3 * (d - 1)];
  return [0.85, Math.max(0, 0.25 * (REACH - d))];
}

/**
 * One drum column of a time picker, styled after the iOS wheel.
 * The browser's own scroll snapping settles the wheel; each frame the rows are
 * magnified, faded and tilted by their distance from the centre, written straight
 * to the DOM. The value is only reported once the wheel has come to rest.
 * `loop` makes the items wrap around endlessly.
 */
export default function TimeWheel({ items, index, onChange, label, loop = false }) {
  const ref = useRef(null);
  const rows = useRef([]);
  const frame = useRef(0);
  const timer = useRef(0);
  const painted = useRef([0, -1]);
  const drag = useRef(null);
  const touching = useRef(false);
  const suppressClick = useRef(false);
  const live = useRef({ index, onChange });
  live.current = { index, onChange };

  const len = items.length;
  const total = loop ? len * COPIES : len;
  // First row of the middle copy: where a looping wheel comes back to rest.
  const base = loop ? len * Math.floor(COPIES / 2) : 0;
  const clamp = (pos) => Math.max(0, Math.min(total - 1, pos));
  const nearest = () => clamp(Math.round(ref.current.scrollTop / ITEM_H));

  const paint = useCallback(() => {
    frame.current = 0;
    const el = ref.current;
    if (!el) return;
    const centre = el.scrollTop / ITEM_H;
    const lo = Math.max(0, Math.floor(centre) - REACH);
    const hi = Math.min(rows.current.length - 1, Math.ceil(centre) + REACH);
    const [oldLo, oldHi] = painted.current;
    for (let i = oldLo; i <= oldHi; i++) {
      if (i >= lo && i <= hi) continue;
      const row = rows.current[i];
      if (!row) continue;
      row.style.transform = '';
      row.style.opacity = '';
    }
    for (let i = lo; i <= hi; i++) {
      const row = rows.current[i];
      if (!row) continue;
      const offset = i - centre;
      const d = Math.abs(offset);
      const [scale, opacity] = rowLook(d);
      const bold = Math.max(0, 1 - d);
      row.style.transform = `perspective(600px) rotateX(${(-offset * 18).toFixed(2)}deg) scale(${scale.toFixed(3)})`;
      row.style.opacity = opacity.toFixed(3);
      row.firstChild.style.opacity = (1 - bold).toFixed(3);
      row.lastChild.style.opacity = bold.toFixed(3);
    }
    painted.current = [lo, hi];
  }, []);

  // Start on the current value and shape the rows around it.
  // eslint-disable-next-line react-hooks/exhaustive-deps
  useLayoutEffect(() => {
    ref.current.scrollTop = (base + index) * ITEM_H;
    paint();
  }, []);

  useEffect(() => () => {
    cancelAnimationFrame(frame.current);
    clearTimeout(timer.current);
  }, []);

  // Runs once the wheel is at rest: bring a looping wheel back to its middle copy
  // (the rows look identical, so the jump is invisible) and report the value.
  const settle = () => {
    if (touching.current || drag.current) return;
    const el = ref.current;
    if (!el) return;
    const pos = nearest();
    const value = pos % len;
    if (loop && pos !== base + value) {
      el.scrollTop = (base + value) * ITEM_H;
      paint();
    }
    if (value !== live.current.index) live.current.onChange(value);
  };

  const armSettle = () => {
    clearTimeout(timer.current);
    timer.current = setTimeout(settle, SETTLE_MS);
  };

  const onScroll = () => {
    if (!frame.current) frame.current = requestAnimationFrame(paint);
    armSettle();
  };

  const goTo = (pos) =>
    ref.current.scrollTo({ top: clamp(pos) * ITEM_H, behavior: prefersReducedMotion() ? 'auto' : 'smooth' });

  const onKeyDown = (e) => {
    if (e.key !== 'ArrowDown' && e.key !== 'ArrowUp') return;
    e.preventDefault();
    goTo(nearest() + (e.key === 'ArrowDown' ? 1 : -1));
  };

  // A finger resting on the wheel must not count as settled.
  const onTouchStart = () => { touching.current = true; };
  const onTouchEnd = () => { touching.current = false; armSettle(); };

  // Mouse drag scrolls the wheel. Touch and trackpads keep their native scrolling.
  const onPointerDown = (e) => {
    if (e.pointerType !== 'mouse' || e.button !== 0) return;
    const el = ref.current;
    drag.current = { y: e.clientY, top: el.scrollTop, moved: false };
    el.setPointerCapture(e.pointerId);
    el.style.scrollSnapType = 'none';
    el.style.cursor = 'grabbing';
  };

  const onPointerMove = (e) => {
    const d = drag.current;
    if (!d) return;
    const dy = e.clientY - d.y;
    if (!d.moved) {
      if (Math.abs(dy) < 3) return;
      d.moved = true;
    }
    ref.current.scrollTop = d.top - dy;
  };

  const endDrag = (e) => {
    const d = drag.current;
    if (!d) return;
    drag.current = null;
    const el = ref.current;
    el.releasePointerCapture?.(e.pointerId);
    el.style.cursor = '';
    el.style.scrollSnapType = '';
    if (d.moved) {
      // A drag must not also select the row it ended on.
      suppressClick.current = true;
      goTo(nearest());
      armSettle();
    }
  };

  const select = (pos) => {
    if (suppressClick.current) {
      suppressClick.current = false;
      return;
    }
    goTo(pos);
  };

  return (
    <div
      ref={ref}
      role="listbox"
      aria-label={label}
      tabIndex={0}
      onScroll={onScroll}
      onKeyDown={onKeyDown}
      onTouchStart={onTouchStart}
      onTouchEnd={onTouchEnd}
      onTouchCancel={onTouchEnd}
      onPointerDown={onPointerDown}
      onPointerMove={onPointerMove}
      onPointerUp={endDrag}
      onPointerCancel={endDrag}
      className="group relative flex-1 h-[200px] overflow-y-auto overscroll-contain snap-y snap-mandatory cursor-grab outline-none select-none [scrollbar-width:none] [&::-webkit-scrollbar]:hidden [-webkit-mask-image:linear-gradient(to_bottom,transparent,black_22%,black_78%,transparent)] [mask-image:linear-gradient(to_bottom,transparent,black_22%,black_78%,transparent)]"
    >
      <div className="h-20" />
      {Array.from({ length: total }, (_, pos) => {
        const item = items[pos % len];
        return (
          <div
            key={pos}
            ref={(el) => { rows.current[pos] = el; }}
            role="option"
            aria-selected={pos === base + index}
            onClick={() => select(pos)}
            className="relative h-10 snap-center flex items-center justify-center cursor-pointer text-[15px] tabular-nums text-foreground opacity-0"
          >
            <span>{item}</span>
            {/* Bold copy cross-fades in at the centre, so only opacity animates. */}
            <span aria-hidden="true" className="absolute inset-0 flex items-center justify-center font-semibold opacity-0 group-focus-visible:text-primary">{item}</span>
          </div>
        );
      })}
      <div className="h-20" />
    </div>
  );
}