import React from 'react';
import { X } from 'lucide-react';
import { cn } from '@/lib/utils';

/**
 * Shared close (X) button — single source of truth for every modal and pane header.
 * Neutral grey at rest, soft red background + red icon on hover, 120ms transition.
 */
export const closeButtonClass =
  'w-8 h-8 rounded-lg flex items-center justify-center bg-transparent text-[#52525b] border-0 hover:bg-[#fde9e7] hover:text-[#c0392b] transition-[background-color,color] duration-[120ms]';

export default function CloseButton({ onClick, className, title = 'Close', ...props }) {
  return (
    <button
      type="button"
      onClick={onClick}
      title={title}
      className={cn(closeButtonClass, className)}
      {...props}
    >
      <X className="w-4 h-4" strokeWidth={1.8} strokeLinecap="round" />
      <span className="sr-only">Close</span>
    </button>
  );
}