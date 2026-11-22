import React, { useRef, useEffect } from 'react';
import { cn } from '@/lib/utils';

/**
 * Single-line-height textarea that grows to fit its content.
 */
export default function AutoGrowTextarea({ value, onChange, className, ...rest }) {
  const ref = useRef(null);

  const resize = () => {
    const el = ref.current;
    if (!el) return;
    el.style.height = 'auto';
    el.style.height = `${el.scrollHeight}px`;
  };

  useEffect(resize, [value]);

  return (
    <textarea
      ref={ref}
      rows={1}
      value={value}
      onChange={(e) => { onChange(e); resize(); }}
      className={cn(
        'w-full resize-none overflow-hidden rounded-md border border-input bg-white px-3 py-2 text-sm shadow-sm outline-none transition-colors placeholder:text-muted-foreground focus-visible:ring-1 focus-visible:ring-ring',
        className
      )}
      {...rest}
    />
  );
}