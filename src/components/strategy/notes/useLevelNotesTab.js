import { useState, useEffect } from 'react';

/** Tab + notes-dirty state for a strategy level drawer; resets to Overview when the item changes. */
export default function useLevelNotesTab(itemId) {
  const [tab, setTab] = useState('overview');
  const [notesDirty, setNotesDirty] = useState(false);
  useEffect(() => { setTab('overview'); setNotesDirty(false); }, [itemId]);
  return { tab, setTab, notesDirty, setNotesDirty };
}