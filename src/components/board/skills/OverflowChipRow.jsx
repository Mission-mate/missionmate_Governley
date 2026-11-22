import React, { useLayoutEffect, useRef, useState } from 'react';

const GAP = 6; // matches gap-1.5
const COUNTER_WIDTH = 32; // room kept for the "+N" count

/**
 * One line of chips: shows as many as fit the available width and a "+N" count for the rest.
 * Every chip is measured in an invisible copy, so the visible line never wraps or clips.
 * Clicks bubble to the row, which opens the member's side pane with the full lists.
 */
export default function OverflowChipRow({ items, renderChip }) {
  const containerRef = useRef(null);
  const measureRef = useRef(null);
  const [visibleCount, setVisibleCount] = useState(items.length);

  useLayoutEffect(() => {
    const container = containerRef.current;
    if (!container) return undefined;
    const compute = () => {
      const available = container.clientWidth;
      const widths = Array.from(measureRef.current?.children || []).map((c) => c.offsetWidth);
      let used = 0;
      let count = 0;
      for (let i = 0; i < widths.length; i += 1) {
        const next = used + (i ? GAP : 0) + widths[i];
        const reserve = i < widths.length - 1 ? GAP + COUNTER_WIDTH : 0;
        if (next + reserve > available) break;
        used = next;
        count += 1;
      }
      setVisibleCount(count);
    };
    compute();
    const observer = new ResizeObserver(compute);
    observer.observe(container);
    return () => observer.disconnect();
  }, [items]);

  const hidden = items.length - visibleCount;

  return (
    <div ref={containerRef} className="relative min-w-0 overflow-hidden">
      <div ref={measureRef} aria-hidden className="absolute left-0 top-0 flex gap-1.5 invisible pointer-events-none whitespace-nowrap">
        {items.map(renderChip)}
      </div>
      <div className="flex items-center gap-1.5 whitespace-nowrap">
        {items.slice(0, visibleCount).map(renderChip)}
        {hidden > 0 && (
          <button type="button" className="text-xs font-medium text-muted-foreground hover:text-foreground transition-colors" title={`${hidden} more`}>
            +{hidden}
          </button>
        )}
      </div>
    </div>
  );
}