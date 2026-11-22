import { useEffect } from 'react';

const HOLD_MS = 300;
const SLOP = 6;

/**
 * @hello-pangea/dnd sensor: a task lifts after a 300 ms press (immediately on a
 * [data-drag-now] grip). Moving before the hold elapses cancels, so taps still click.
 */
export default function useLongPressSensor(api) {
  useEffect(() => {
    let cleanup = null;

    const onDown = (e) => {
      if (e.button !== 0 || cleanup) return;
      if (e.target.closest('button, input, a, [role="checkbox"], [data-no-drag]')) return;
      const id = api.findClosestDraggableId(e);
      if (!id || !api.canGetLock(id)) return;
      const start = { x: e.clientX, y: e.clientY };
      let drag = null;
      let preDrag = null;

      const end = () => { clearTimeout(timer); window.removeEventListener('pointermove', onMove); window.removeEventListener('pointerup', onUp); window.removeEventListener('pointercancel', onCancel); cleanup = null; };
      const swallowClick = () => window.addEventListener('click', (ev) => { ev.stopPropagation(); ev.preventDefault(); }, { capture: true, once: true });
      const onMove = (ev) => {
        const p = { x: ev.clientX, y: ev.clientY };
        if (drag) { ev.preventDefault(); drag.move(p); return; }
        if (Math.hypot(p.x - start.x, p.y - start.y) > SLOP) { if (preDrag?.isActive()) preDrag.abort(); end(); }
      };
      const onUp = () => { if (drag) { drag.drop(); swallowClick(); } else if (preDrag?.isActive()) preDrag.abort(); end(); };
      const onCancel = () => { if (drag) drag.cancel(); else if (preDrag?.isActive()) preDrag.abort(); end(); };
      const lift = () => {
        preDrag = api.tryGetLock(id, end, { sourceEvent: e });
        if (preDrag) drag = preDrag.fluidLift(start); else end();
      };
      const timer = setTimeout(lift, e.target.closest('[data-drag-now]') ? 0 : HOLD_MS);
      window.addEventListener('pointermove', onMove, { passive: false });
      window.addEventListener('pointerup', onUp);
      window.addEventListener('pointercancel', onCancel);
      cleanup = end;
    };

    window.addEventListener('pointerdown', onDown);
    return () => { window.removeEventListener('pointerdown', onDown); cleanup?.(); };
  }, [api]);
}