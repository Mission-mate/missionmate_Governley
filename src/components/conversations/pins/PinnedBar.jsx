import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Loader2, Pin, PinOff } from 'lucide-react';
import { firstName, pinPreview } from '@/lib/conversations';
import { cn } from '@/lib/utils';

// More pins than this show as one continuous track instead of segments.
const MAX_SEGMENTS = 6;

/**
 * Compact bar above the thread showing one pinned item at a time. Clicking it jumps to the item
 * and moves on to the next pin; `onJump(pin)` and `onUnpin(pin)` resolve when done.
 */
export default function PinnedBar({ pins, meId, people, onJump, onUnpin }) {
  const [index, setIndex] = useState(0);
  const [busy, setBusy] = useState(false);
  const current = Math.min(index, pins.length - 1);
  const pin = pins[current];

  const jump = () => {
    onJump(pin);
    setIndex((current + 1) % pins.length);
  };

  const unpin = async () => {
    setBusy(true);
    try {
      await onUnpin(pin);
    } finally {
      setBusy(false);
    }
  };

  const sender = pin.sender_id === meId ? 'You' : firstName(people, pin.sender_id);
  return (
    <motion.div
      initial={{ opacity: 0, y: -6 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.24, ease: [0.22, 1, 0.36, 1] }}
      className="shrink-0 border-b border-border bg-card px-4 md:px-8"
    >
      <div className="max-w-3xl mx-auto flex items-center gap-2 py-2">
        <button
          type="button"
          onClick={jump}
          title={pin.poll_question ? 'Go to poll' : 'Go to message'}
          className="group flex-1 min-w-0 flex items-center gap-3 rounded-lg px-2 py-1 -mx-2 text-left hover:bg-muted/60 transition-colors duration-200"
        >
          <span aria-hidden className="flex flex-col gap-0.5 h-9 w-[3px] shrink-0">
            {(pins.length > MAX_SEGMENTS ? [current] : pins.map((_, i) => i)).map((i) => (
              <span key={i} className={cn('flex-1 rounded-full transition-colors duration-200', i === current ? 'bg-primary' : 'bg-primary/25')} />
            ))}
          </span>
          <span className="w-8 h-8 rounded-full bg-primary/10 text-primary flex items-center justify-center shrink-0">
            <Pin className="w-3.5 h-3.5" strokeWidth={2.2} />
          </span>
          <span className="min-w-0">
            <span className="block text-xs font-semibold text-primary">
              {pin.poll_question ? 'Pinned poll' : 'Pinned message'}
              {pins.length > 1 && <span className="font-medium text-muted-foreground tabular-nums"> · {current + 1} of {pins.length}</span>}
            </span>
            <span className="block text-sm text-foreground truncate">
              <span className="text-muted-foreground">{sender}: </span>{pin.poll_question && '📊 '}{pinPreview(pin)}
            </span>
          </span>
        </button>
        <button
          type="button"
          onClick={unpin}
          disabled={busy}
          title="Unpin"
          aria-label="Unpin"
          className="shrink-0 h-8 w-8 rounded-full flex items-center justify-center text-muted-foreground hover:text-foreground hover:bg-accent transition-colors duration-200 disabled:opacity-50"
        >
          {busy ? <Loader2 className="w-4 h-4 animate-spin" /> : <PinOff className="w-4 h-4" strokeWidth={1.8} />}
        </button>
      </div>
    </motion.div>
  );
}