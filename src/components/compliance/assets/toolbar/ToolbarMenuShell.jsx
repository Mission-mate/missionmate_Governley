import React, { useRef, useEffect } from 'react';
import { cn } from '@/lib/utils';

/** Dropdown shell for the asset toolbar menus — closes on outside click. */
export default function ToolbarMenuShell({ onClose, children }) {
  const ref = useRef(null);
  useEffect(() => {
    const handler = (e) => { if (ref.current && !ref.current.contains(e.target)) onClose(); };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [onClose]);
  return (
    <div ref={ref} className={cn('animate-dropdown-enter absolute top-full right-0 mt-1.5 z-50 min-w-[220px] bg-popover border border-border rounded-lg shadow-lg py-1.5')}>
      {children}
    </div>
  );
}

export const MENU_HEADING = 'px-3 py-1.5 text-[11px] font-semibold text-muted-foreground uppercase tracking-wider';
export const MENU_ITEM = 'w-full flex items-center justify-between px-3 py-2 text-sm hover:bg-muted/50 text-left';