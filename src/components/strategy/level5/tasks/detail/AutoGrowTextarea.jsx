import React, { useRef, useEffect } from 'react';
import { cn } from '@/lib/utils';

/** A textarea that grows with its content so long text is shown in full (no scroll). */
export default function AutoGrowTextarea({ value, onChange, placeholder, className, ...props }) {
  const ref = useRef(null);

  const resize = () => {
    const el = ref.current;
    if (!el) return;
    el.style.height = 'auto';
    // Include borders so the last line is never clipped under border-box sizing.
    el.style.height = `${el.scrollHeight + el.offsetHeight - el.clientHeight}px`;
  };

  useEffect(() => { resize(); }, [value]);

  // Re-measure when the width changes (pane slide-in, widen/collapse) so wrapping stays in full view.
  useEffect(() => {
    const el = ref.current;
    if (!el) return undefined;
    const ro = new ResizeObserver(() => resize());
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  return (
    <textarea
      ref={ref}
      value={value}
      onChange={(e) => { onChange(e.target.value); resize(); }}
      placeholder={placeholder}
      rows={1}
      className={cn('w-full resize-none overflow-hidden bg-transparent outline-none', className)}
      {...props}
    />
  );
}