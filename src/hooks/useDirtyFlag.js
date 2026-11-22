import { useEffect, useRef } from 'react';
import { setEditorDirty } from '@/lib/unsavedChanges/dirtyRegistry';

/**
 * Registers an explicit dirty flag with the shared registry, for surfaces that
 * don't hold a single draft object (inline cards, page-level editors). Cleared
 * automatically on unmount.
 */
export default function useDirtyFlag(isDirty) {
  const idRef = useRef(`flag_${Math.random().toString(36).slice(2)}`);
  useEffect(() => {
    const id = idRef.current;
    setEditorDirty(id, !!isDirty);
    return () => setEditorDirty(id, false);
  }, [isDirty]);
}