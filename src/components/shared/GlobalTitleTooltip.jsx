import React, { useEffect, useLayoutEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';

// Icon and interactive-control hints only; titles on plain content keep native behaviour.
const INTERACTIVE = 'button, a[href], [role="button"], [role="tab"], [role="menuitem"], [role="checkbox"], [role="switch"], input, select, label, summary, svg, [tabindex]';
const GAP = 8;
const PAD = 8;

/** Swaps native `title` hints on controls for the app's styled tooltip, app-wide. */
export default function GlobalTitleTooltip() {
  const [tip, setTip] = useState(null); // { el, text }
  const [pos, setPos] = useState(null);
  const boxRef = useRef(null);
  const timer = useRef(null);

  useEffect(() => {
    const restore = (el) => {
      if (el?.dataset.tip != null && !el.hasAttribute('title')) el.setAttribute('title', el.dataset.tip);
      if (el) delete el.dataset.tip;
    };
    let current = null;
    const hide = () => { clearTimeout(timer.current); restore(current); current = null; setTip(null); setPos(null); };
    const show = (e, delay) => {
      // Controls with their own styled tooltip (data-own-tip) suppress any ancestor's title hint.
      if (e.target.closest?.('[data-own-tip]')) {
        const owner = e.target.closest('[title]');
        if (owner === current) return;
        hide();
        // Park the ancestor's title so the browser doesn't show it natively either; restored on leave.
        if (owner) { current = owner; owner.dataset.tip = owner.getAttribute('title'); owner.removeAttribute('title'); }
        return;
      }
      const el = e.target.closest?.('[title]');
      if (!el || el === current) return;
      if (!el.matches(INTERACTIVE) && !el.querySelector('svg')) return;
      const text = el.getAttribute('title');
      if (!text) return;
      hide();
      current = el;
      el.dataset.tip = text;
      el.removeAttribute('title'); // suppress the browser hint
      timer.current = setTimeout(() => setTip({ el, text }), delay);
    };
    const onOver = (e) => show(e, 200);
    const onFocus = (e) => { if (e.target.matches?.(':focus-visible')) show(e, 0); };
    const onOut = (e) => { if (current && !current.contains(e.relatedTarget)) hide(); };
    const onKey = (e) => { if (e.key === 'Escape') hide(); };
    document.addEventListener('pointerover', onOver);
    document.addEventListener('pointerout', onOut);
    document.addEventListener('focusin', onFocus);
    document.addEventListener('focusout', hide);
    document.addEventListener('pointerdown', hide, true);
    document.addEventListener('keydown', onKey);
    window.addEventListener('scroll', hide, true);
    window.addEventListener('resize', hide);
    return () => {
      hide();
      document.removeEventListener('pointerover', onOver);
      document.removeEventListener('pointerout', onOut);
      document.removeEventListener('focusin', onFocus);
      document.removeEventListener('focusout', hide);
      document.removeEventListener('pointerdown', hide, true);
      document.removeEventListener('keydown', onKey);
      window.removeEventListener('scroll', hide, true);
      window.removeEventListener('resize', hide);
    };
  }, []);

  // Place above; flip below when there's no room; shift sideways to stay on screen.
  useLayoutEffect(() => {
    if (!tip || !boxRef.current) return;
    if (!tip.el.isConnected) { setTip(null); return; }
    const r = tip.el.getBoundingClientRect();
    const b = boxRef.current.getBoundingClientRect();
    let top = r.top - b.height - GAP;
    let side = 'top';
    if (top < PAD) { top = r.bottom + GAP; side = 'bottom'; }
    const left = Math.min(Math.max(PAD, r.left + r.width / 2 - b.width / 2), window.innerWidth - b.width - PAD);
    setPos({ top, left, side });
  }, [tip]);

  if (!tip) return null;
  return createPortal(
    <div
      ref={boxRef}
      role="tooltip"
      data-side={pos?.side}
      style={{ top: pos?.top ?? -9999, left: pos?.left ?? -9999 }}
      className="fixed z-[200] pointer-events-none max-w-xs rounded-xl border border-border/60 bg-popover px-3.5 py-2 text-xs font-medium text-popover-foreground shadow-[0_4px_16px_rgba(15,23,42,0.08)] dark:shadow-[0_6px_20px_rgba(0,0,0,0.45)] animate-in fade-in-0 zoom-in-95"
    >
      {tip.text}
    </div>,
    document.body
  );
}