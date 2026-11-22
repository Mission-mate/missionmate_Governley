import { useRef, useState } from 'react';

/**
 * Lets a pane's own footer drive the note open in its Notes tab, so there is one Cancel / Save Changes.
 * Pass `actionsRef` to PageNotesTab / SinglePageDocument: the note then shows no footer of its own.
 *  - saveThen(next): saves the open note if it has unsaved edits, then runs `next`
 *    (save the pane's other edits, or leave edit mode). A failed save stops there — the note reports it.
 *  - cancel(): restores the open note to its saved content.
 */
export default function useNoteActions() {
  const actionsRef = useRef(null);
  const [saving, setSaving] = useState(false);

  const saveThen = async (next) => {
    const actions = actionsRef.current;
    if (actions) {
      setSaving(true);
      const ok = await actions.save();
      setSaving(false);
      if (!ok) return;
    }
    next?.();
  };
  const cancel = () => actionsRef.current?.cancel();

  return { actionsRef, saving, saveThen, cancel };
}