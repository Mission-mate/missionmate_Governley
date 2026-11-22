import React, { useState, useEffect } from 'react';
import SlidePane from '@/components/ui/SlidePane';
import { Button } from '@/components/ui/button';
import PaneIconHeaderActions from '@/components/shared/PaneIconHeaderActions';
import ViewModeHint from '@/components/shared/ViewModeHint';
import EditFooterActions from '@/components/shared/EditFooterActions';
import NoteTitleField from '@/components/notes/pages/NoteTitleField';
import NoteIcon from '@/components/notes/NoteIcon';
import NoteQuillEditor from './pages/NoteQuillEditor';
import PageMetaRow from './pages/PageMetaRow';
import { localToday } from '@/lib/localClock';
import useUnsavedChanges from '@/hooks/useUnsavedChanges';

// The editor renders an empty page as an empty paragraph — treat that as empty.
const noteSnapshot = (d) => ({ ...d, content: (d.content || '').replace(/^<p><br><\/p>$/, '') });

const draftFrom = (note, defaultOwner, defaultTitle = '') => ({
  title: note?.title || defaultTitle,
  owner_name: note ? note.owner_name || '' : defaultOwner || '',
  page_date: note ? note.page_date || '' : localToday(),
  content: note?.content || '',
});

/**
 * Page-style slide drawer for a single note: title, owner/date meta row and the
 * rich-text note editor. `note` null = create. View mode is read-only with an Edit icon.
 */
export default function NotePagePane({ isOpen, note, startEditing, readOnly, defaultOwner, defaultTitle, hint, onClose, onSave }) {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(draftFrom(null));
  const [resetKey, setResetKey] = useState(0);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!isOpen) return;
    setDraft(draftFrom(note, defaultOwner, defaultTitle));
    setEditing(!readOnly && (startEditing || !note));
    setResetKey((k) => k + 1);
  }, [isOpen, note?.id]);

  const set = (patch) => setDraft((d) => ({ ...d, ...patch }));
  const viewMode = !editing;

  const { isDirty, requestClose, dialog } = useUnsavedChanges({
    draft, baseline: draftFrom(note, defaultOwner, defaultTitle), onClose, saving,
    enabled: isOpen && editing, select: noteSnapshot, subject: 'note changes',
  });

  // Cancel restores the saved note and returns to view mode; a new note's Cancel closes the pane.
  const revertDraft = () => {
    setDraft(draftFrom(note, defaultOwner, defaultTitle));
    setResetKey((k) => k + 1);
    setEditing(false);
  };
  const handleCancel = () => (note ? revertDraft() : requestClose());

  // Saving an existing note returns to view mode; a new note closes the pane.
  const handleSave = async () => {
    setSaving(true);
    try {
      await onSave(draft);
      if (note) setEditing(false); else onClose();
    } finally {
      setSaving(false);
    }
  };

  return (
    <>
    <SlidePane isOpen={isOpen} onClose={requestClose}>
      <div className="h-full bg-card border-l border-border shadow-2xl flex flex-col overflow-hidden" onClick={(e) => e.stopPropagation()}>
        <div className="px-5 py-4 border-b border-border shrink-0">
          <div className="flex items-center justify-between">
            <h2 className="text-base font-semibold text-foreground">
              {!note ? 'Add Note' : viewMode ? 'View Note' : 'Edit Note'}
            </h2>
            <PaneIconHeaderActions showEdit={viewMode && !readOnly} onEdit={() => setEditing(true)} onClose={requestClose} />
          </div>
          {!!note && !readOnly && <ViewModeHint className="mt-1.5" editing={!viewMode} />}
        </div>

        <div className="flex-1 min-h-0 flex flex-col px-6 pt-6">
          <div className="shrink-0 flex items-start gap-3">
          <NoteIcon color={note?.color} size={40} />
          <div className="flex-1 min-w-0">
            {viewMode ? (
              <h2 className="text-xl font-semibold text-foreground break-words">{draft.title || 'Untitled'}</h2>
            ) : (
              <NoteTitleField value={draft.title} onChange={(title) => set({ title })} autoFocus={!note} />
            )}
            <PageMetaRow
              owner={draft.owner_name}
              date={draft.page_date}
              onOwnerChange={(owner_name) => set({ owner_name })}
              onDateChange={(page_date) => set({ page_date })}
              readOnly={viewMode}
            />
            {hint && !viewMode && !(draft.content || '').replace(/<[^>]*>/g, '').trim() && (
              <p className="mt-3 text-sm text-muted-foreground">{hint}</p>
            )}
          </div>
          </div>
          <div className="mt-3 flex-1 min-h-0 flex flex-col">
            <NoteQuillEditor
              key={`${note?.id || 'new'}-${resetKey}-${viewMode ? 'v' : 'e'}`}
              value={draft.content}
              onChange={(content) => set({ content })}
              readOnly={viewMode}
            />
          </div>
        </div>

        <div className="px-5 py-4 border-t border-border flex items-center justify-end gap-2 shrink-0">
          {viewMode ? (
            <Button variant="outline" onClick={onClose}>Close</Button>
          ) : (
            <EditFooterActions dirty={!note || isDirty} onCancel={handleCancel}
              onSave={handleSave} saving={saving} saveLabel={note ? 'Save Changes' : 'Add Note'} />
          )}
        </div>
      </div>
    </SlidePane>
    {dialog}
    </>
  );
}