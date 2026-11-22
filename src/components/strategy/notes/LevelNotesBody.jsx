import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import EditFooterActions from '@/components/shared/EditFooterActions';
import useNoteActions from '@/hooks/useNoteActions';
import PageNotesTab from '@/components/notes/pages/PageNotesTab';
import { STRATEGY_BLOCK_NOTES } from './levelNotes';

/**
 * Notes tab body for strategy level drawers — the note list / open note edge to edge, plus one footer:
 * Close in view mode; Cancel (guarded, back to view-only) + Save Changes in edit mode.
 * Save Changes writes the open note, then `onSaved` saves the drawer's edited fields or leaves edit mode.
 */
export default function LevelNotesBody({ item, readOnly, onDirtyChange, onClose, onCancelEdit, formDirty, onSaved }) {
  const [dirty, setDirty] = useState(false);
  const note = useNoteActions();
  return (
    <>
      <div className="flex-1 min-h-0 flex">
        <PageNotesTab
          key={`${item.id}-${readOnly ? 'view' : 'edit'}`}
          objectType={STRATEGY_BLOCK_NOTES}
          objectId={item.id}
          readOnly={readOnly}
          flush
          onDirtyChange={(d) => { setDirty(d); onDirtyChange(d); }}
          actionsRef={note.actionsRef}
        />
      </div>
      <div className="flex justify-end gap-3 px-5 py-4 border-t border-border shrink-0">
        {readOnly
          ? <Button variant="outline" onClick={onClose}>Close</Button>
          : <EditFooterActions dirty={dirty || formDirty} onCancel={onCancelEdit}
              onSave={() => note.saveThen(onSaved)} saving={note.saving} />}
      </div>
    </>
  );
}