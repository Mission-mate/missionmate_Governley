import { useEffect, useRef } from 'react';

/** Auto-open a block's detail pane when arriving via a deep link (?block=<id>). Re-arms whenever the target id changes. */
export default function useInitialOpen(initialOpenId, blocks, onOpen) {
  const consumedId = useRef(null);
  useEffect(() => {
    if (!initialOpenId || !blocks?.length) return;
    if (consumedId.current === initialOpenId) return;
    const b = blocks.find((x) => x.id === initialOpenId);
    if (b) {
      consumedId.current = initialOpenId;
      onOpen(b);
    }
  }, [initialOpenId, blocks, onOpen]);
}