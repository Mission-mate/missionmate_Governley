import React, { useState, useRef, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { cn } from '@/lib/utils';
import { LEVEL2_COLORS, LEVEL2_COLOR_KEYS } from '@/lib/strategyLevel2';

/** Colour swatch trigger + 5-tint palette popover — matches the register Add Column picker. */
export default function ColorPicker({ value, onChange }) {
  const [open, setOpen] = useState(false);
  const [pos, setPos] = useState({ top: 0, left: 0 });
  const btnRef = useRef(null);
  const popRef = useRef(null);
  const color = LEVEL2_COLORS[value] || LEVEL2_COLORS.blue;

  useEffect(() => {
    if (open && btnRef.current) {
      const r = btnRef.current.getBoundingClientRect();
      setPos({ top: r.bottom + 4, left: r.left });
    }
  }, [open]);

  useEffect(() => {
    if (!open) return;
    // The palette renders in a portal, so it must be excluded explicitly or the
    // outside-click handler closes it before a swatch click can register.
    const handler = (e) => {
      if (btnRef.current?.contains(e.target) || popRef.current?.contains(e.target)) return;
      setOpen(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [open]);

  return (
    <>
      <button
        ref={btnRef}
        type="button"
        onClick={() => setOpen((v) => !v)}
        className={cn('w-7 h-7 rounded-full flex items-center justify-center border-2 border-white shadow-sm hover:scale-105 transition-transform shrink-0', color.bg)}
      >
        <span className={cn('w-3 h-3 rounded-full', color.dot)} />
      </button>
      {open && createPortal(
        <div
          ref={popRef}
          className="animate-dropdown-enter fixed z-[100] bg-white dark:bg-card border border-border rounded-lg shadow-lg p-2 flex gap-1.5"
          style={{ top: pos.top, left: pos.left }}
        >
          {LEVEL2_COLOR_KEYS.map((k) => (
            <button
              key={k}
              type="button"
              onClick={() => { onChange(k); setOpen(false); }}
              className={cn(
                'w-6 h-6 rounded-full border-2 flex items-center justify-center transition-all hover:scale-110',
                LEVEL2_COLORS[k].bg,
                value === k ? 'border-gray-400 scale-110' : 'border-transparent'
              )}
            >
              <span className={cn('w-3 h-3 rounded-full', LEVEL2_COLORS[k].dot)} />
            </button>
          ))}
        </div>,
        document.body
      )}
    </>
  );
}