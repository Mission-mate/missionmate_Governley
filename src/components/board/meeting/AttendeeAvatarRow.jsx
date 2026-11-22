import React, { useLayoutEffect, useRef, useState } from 'react';
import { cn } from '@/lib/utils';

const SIZE = 44; // circle diameter (w-11)
const STEP = 36; // each further circle overlaps the previous by 8px (-ml-2)

function initials(name = '') {
  return name.split(' ').filter(Boolean).slice(0, 2).map(p => p[0]?.toUpperCase()).join('');
}

// An opaque card-coloured disc sits under the tint, so overlapping circles never blend.
function Circle({ className, title, children }) {
  return (
    <span title={title} className="-ml-2 first:ml-0 w-11 h-11 shrink-0 rounded-full bg-card ring-2 ring-card">
      <span className={cn('w-full h-full rounded-full flex items-center justify-center text-sm font-semibold', className)}>
        {children}
      </span>
    </span>
  );
}

/** One row of attendee initials in meeting order; those that do not fit are summed into a "+N" circle. */
export default function AttendeeAvatarRow({ attendees }) {
  const ref = useRef(null);
  const [slots, setSlots] = useState(attendees.length);

  useLayoutEffect(() => {
    const el = ref.current;
    const compute = () => setSlots(Math.max(1, Math.floor((el.clientWidth - SIZE) / STEP) + 1));
    compute();
    const observer = new ResizeObserver(compute);
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  // When not everyone fits, the last slot is used by the "+N" circle.
  const visible = attendees.length <= slots ? attendees.length : Math.max(0, slots - 1);
  const hidden = attendees.length - visible;

  return (
    <div ref={ref} className="flex items-center min-w-0 overflow-hidden p-0.5">
      {attendees.slice(0, visible).map(a => (
        <Circle key={a.id} title={a.member_name} className="bg-primary/10 text-primary">
          {initials(a.member_name) || '?'}
        </Circle>
      ))}
      {hidden > 0 && (
        <Circle title={`${hidden} more`} className="bg-muted text-foreground">+{hidden}</Circle>
      )}
    </div>
  );
}