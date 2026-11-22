import React, { useState } from 'react';
import { Loader2, Pin, PinOff } from 'lucide-react';
import { cn } from '@/lib/utils';

/** Hover action beside a message or poll that pins or unpins it. `onToggle(pinned)` resolves once saved. */
export default function PinToggle({ pinned, onToggle }) {
  const [busy, setBusy] = useState(false);

  const click = async () => {
    setBusy(true);
    try {
      await onToggle(!pinned);
    } finally {
      setBusy(false);
    }
  };

  const Icon = busy ? Loader2 : pinned ? PinOff : Pin;
  return (
    <button
      type="button"
      onClick={click}
      disabled={busy}
      title={pinned ? 'Unpin' : 'Pin to the top of the chat'}
      aria-label={pinned ? 'Unpin' : 'Pin'}
      className={cn(
        'shrink-0 h-7 w-7 rounded-full flex items-center justify-center text-muted-foreground',
        'hover:text-foreground hover:bg-accent focus-visible:opacity-100 transition-[opacity,color,background-color] duration-200',
        'md:opacity-0 md:group-hover:opacity-100',
        busy && 'md:opacity-100'
      )}
    >
      <Icon className={cn('w-3.5 h-3.5', busy && 'animate-spin')} strokeWidth={2} />
    </button>
  );
}