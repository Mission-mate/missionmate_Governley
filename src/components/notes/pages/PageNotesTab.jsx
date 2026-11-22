import React, { useState, useEffect, useRef } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useToast } from '@/components/ui/use-toast';
import { cn } from '@/lib/utils';
import ModuleLoader from '@/components/shared/states/ModuleLoader';
import LoadError from '@/components/shared/states/LoadError';
import ConfirmTypeDialog from '@/components/board/documents/ConfirmTypeDialog';
import SelectionActionBar from '@/components/documents/SelectionActionBar';
import { PAGER_SIZE } from '@/components/documents/FolderPager';
import NoteFormModal from '@/components/notes/NoteFormModal';
import { ELEVATED_CARD } from '@/components/shared/cardStyles';
import NotePageList from './NotePageList';
import PageEditor from './PageEditor';
import { listNotePages, createNotePage, updateNotePage, deleteNotePage } from '@/lib/notePages';

const snapshotOf = (page) => ({
  id: page.id, title: page.title || '', content: page.content || '',
  owner_name: page.owner_name || '', page_date: page.page_date || '', color: page.color,
});

/**
 * Side-pane notes for one record: a paged list of notes, each opening in place as a document.
 * Edit mode (`readOnly` false) adds selection, the "New note" row and the Open / Edit / Delete bar.
 * Edits to an open note are explicit — it becomes dirty and is only written on Save.
 * Module-agnostic — pass objectType/objectId to reuse it elsewhere.
 */
export default function PageNotesTab({
  objectType, objectId, readOnly = false, flush = false, onDirtyChange, noteEntity = 'NotePage', actionsRef,
}) {
  const qc = useQueryClient();
  const { toast } = useToast();
  const queryKey = ['notePages', objectType, objectId];

  const [listPage, setListPage] = useState(1);
  const [selectedId, setSelectedId] = useState(null);
  const [draft, setDraft] = useState(null); // the open note's live edits
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState(null); // { note } — note null = create
  const [deleteTarget, setDeleteTarget] = useState(null);

  const { data: pages = [], isLoading, isFetchedAfterMount, ...read } = useQuery({
    queryKey,
    queryFn: () => listNotePages(objectType, objectId, noteEntity),
    enabled: !!objectId,
  });

  const invalidate = () => qc.invalidateQueries({ queryKey });

  // Last confirmed-saved (or loaded) content of the open note. Refetches never touch it,
  // so typing done while a save is in flight is kept as new unsaved edits.
  const savedBaselineRef = useRef(null);
  const openNote = (page) => {
    const snapshot = snapshotOf(page);
    savedBaselineRef.current = snapshot;
    setSelectedId(null);
    setDraft(snapshot);
  };
  const closeNote = () => { savedBaselineRef.current = null; setDraft(null); };

  const baseline = savedBaselineRef.current;
  const dirty = !readOnly && !!draft && !!baseline && baseline.id === draft.id && (
    draft.title !== baseline.title || draft.content !== baseline.content
    || draft.owner_name !== baseline.owner_name || draft.page_date !== baseline.page_date
  );

  // Latest callback in a ref so a non-memoized parent handler can't retrigger the effect.
  const onDirtyChangeRef = useRef(onDirtyChange);
  onDirtyChangeRef.current = onDirtyChange;
  useEffect(() => { onDirtyChangeRef.current?.(dirty); }, [dirty]);
  // Unmounting (tab switch, view↔edit remount) discards the draft — report clean.
  useEffect(() => () => onDirtyChangeRef.current?.(false), []);

  // An open note that no longer exists falls back to the list.
  useEffect(() => {
    if (draft && !pages.some((p) => p.id === draft.id)) closeNote();
  }, [pages]);

  // The page is clamped, so deleting the last note on a page falls back to the previous one.
  const totalPages = Math.max(1, Math.ceil(pages.length / PAGER_SIZE));
  const safePage = Math.min(listPage, totalPages);
  const pageNotes = pages.slice((safePage - 1) * PAGER_SIZE, safePage * PAGER_SIZE);
  const selected = readOnly ? null : pages.find((p) => p.id === selectedId) || null;
  // Changing page clears the selection, so the action bar never acts on a hidden note.
  const changePage = (p) => { setListPage(p); setSelectedId(null); };

  const handleSave = async () => {
    const snapshot = { ...draft };
    setSaving(true);
    try {
      await updateNotePage(snapshot.id, {
        title: snapshot.title, content: snapshot.content,
        owner_name: snapshot.owner_name, page_date: snapshot.page_date,
      }, noteEntity);
      // Baseline = what was actually persisted; the live draft is left untouched.
      if (savedBaselineRef.current?.id === snapshot.id) savedBaselineRef.current = snapshot;
      setSaving(false);
      invalidate();
      return true;
    } catch {
      setSaving(false);
      toast({ title: 'Error', description: 'Failed to save this note.', variant: 'destructive' });
      return false;
    }
  };

  const handleCancel = () => {
    const base = savedBaselineRef.current;
    if (base && base.id === draft?.id) setDraft({ ...base });
  };

  // Failures are thrown back to the form modal, which reports them and stays open.
  const handleFormSave = async (fields) => {
    if (form.note) {
      await updateNotePage(form.note.id, fields, noteEntity);
      await invalidate();
      setForm(null);
      return;
    }
    const created = await createNotePage(objectType, objectId, {
      ...fields,
      // One below the current minimum so the new note sorts to the top.
      order_index: pages.length ? Math.min(...pages.map((p) => p.order_index ?? 0)) - 1 : 0,
    }, noteEntity);
    await invalidate();
    setForm(null);
    setListPage(1);
    openNote(created);
  };

  const handleDelete = async () => {
    try {
      await deleteNotePage(deleteTarget.id, noteEntity);
      setDeleteTarget(null);
      setSelectedId(null);
      invalidate();
    } catch {
      toast({ title: 'Error', description: 'Failed to delete the note.', variant: 'destructive' });
    }
  };

  if (isLoading || !isFetchedAfterMount) {
    return (
      <div className={cn('flex h-full w-full items-center justify-center bg-card', !flush && ELEVATED_CARD)}>
        <ModuleLoader className="w-full" />
      </div>
    );
  }

  if (read.isLoadingError) return <LoadError failure={read} title="Couldn’t load notes" />;

  return (
    <div className={cn('flex min-h-0 h-full w-full overflow-hidden bg-card', !flush && ELEVATED_CARD)}>
      {draft ? (
        <PageEditor
          page={draft}
          color={draft.color}
          onBack={closeNote}
          actionsRef={actionsRef}
          dirty={dirty}
          saving={saving}
          onSave={handleSave}
          onCancel={handleCancel}
          onTitleChange={(title) => setDraft((d) => ({ ...d, title }))}
          onContentChange={(content) => setDraft((d) => (content === d.content ? d : { ...d, content }))}
          onMetaChange={(patch) => setDraft((d) => ({ ...d, ...patch }))}
          readOnly={readOnly}
        />
      ) : (
        <div className="flex-1 min-w-0 overflow-y-auto px-5 py-4">
          <div className="flex flex-col min-h-full">
            {readOnly && pages.length === 0 ? (
              <p className="py-8 text-center text-sm text-muted-foreground">No notes yet.</p>
            ) : (
              <NotePageList
                notes={pageNotes}
                page={safePage}
                totalPages={totalPages}
                onPageChange={changePage}
                selectedId={selected?.id}
                onSelect={readOnly ? undefined : (id) => setSelectedId((cur) => (cur === id ? null : id))}
                onOpen={openNote}
                onNewNote={readOnly ? undefined : () => setForm({ note: null })}
              />
            )}
            <SelectionActionBar
              open={!!selected}
              onOpen={() => openNote(selected)}
              onEdit={() => setForm({ note: selected })}
              onDelete={() => setDeleteTarget(selected)}
              onClear={() => setSelectedId(null)}
            />
          </div>
        </div>
      )}

      <NoteFormModal isOpen={!!form} note={form?.note || null} onConfirm={handleFormSave} onCancel={() => setForm(null)} />

      <ConfirmTypeDialog
        isOpen={!!deleteTarget}
        title="Delete Note"
        message={<>This action cannot be undone. This will permanently delete <span className="font-bold text-foreground">{deleteTarget?.title}</span>.</>}
        keyword="DELETE"
        confirmLabel="Delete"
        onConfirm={handleDelete}
        onClose={() => setDeleteTarget(null)}
      />
    </div>
  );
}