import React from 'react';
import { Plus } from 'lucide-react';

/** Red plus marker on a navigation icon tile; the tile must be `relative`. */
export default function NavUnreadBadge() {
  return (
    <span className="absolute -top-1 -right-1 w-3.5 h-3.5 rounded-full bg-rose-500 text-white ring-2 ring-sidebar flex items-center justify-center animate-in fade-in duration-200 ease-out motion-reduce:animate-none">
      <Plus style={{ width: '10px', height: '10px' }} strokeWidth={3.5} aria-hidden="true" />
      <span className="sr-only">New unread messages</span>
    </span>
  );
}