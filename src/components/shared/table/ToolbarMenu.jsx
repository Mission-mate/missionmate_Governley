import React, { useRef, useEffect } from 'react';

/** Shared dropdown surface for toolbar buttons (Group / Filter / Export). */
export default function ToolbarMenu({ onClose, children, className = '' }) {
  const ref = useRef(null);
  useEffect(() => {
    const handler = (e) => { if (ref.current && !ref.current.contains(e.target)) onClose(); };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [onClose]);
  return (
    <div
      ref={ref}
      className={`animate-dropdown-enter absolute top-full mt-1.5 right-0 z-50 min-w-[220px] bg-white border border-border rounded-lg shadow-lg py-1.5 ${className}`}
    >
      {children}
    </div>
  );
}