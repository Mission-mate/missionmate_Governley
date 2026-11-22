import React, { useEffect, useState } from 'react';
import { Plus } from 'lucide-react';
import { useQueryClient } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { useToast } from '@/components/ui/use-toast';
import { cn } from '@/lib/utils';
import { ELEVATED_CARD } from '@/components/shared/cardStyles';
import ModuleLoader from '@/components/shared/states/ModuleLoader';
import LoadError from '@/components/shared/states/LoadError';
import { createNotePage, updateNotePage, deleteNotePage } from '@/lib/notePages';
import NotesTable from './NotesTable';
import NotesToolbar from './NotesToolbar';
import NotePagePane from './NotePagePane';
import NoteFormModal from './NoteFormModal';
import DeleteNoteDialog from './DeleteNoteDialog';
import Pagination from '@/components/shared/Pagination';
import RowBulkBar from '@/components/risk/register/RowBulkBar';
import usePagedNotePages from '@/hooks/usePagedNotePages';

/** Paginated, sortable notes table for full-page detail views (side panes use PageNotesTab). */
export default function NotesTab({ objectType, objectId, currentUser }) {
  const qc = useQueryClient();
  const { toast } = useToast();
  const [pane, setPane] = useState(null); // { note, edit }
  const [creating, setCreating] = useState(false);
  const [deleteNote, setDeleteNote] = useState(null);
  const [selectedId, setSelectedId] = useState(null);
  const queryKey = ['notePagesTab', objectType, objectId];
  const paged = usePagedNotePages(queryKey, objectType, objectId, true);
  const invalidate = () => qc.invalidateQueries({ queryKey });
  const selected = paged.notes.find((n) => n.id === selectedId) || null;

  const [searchInput, setSearchInput] = useState('');
  useEffect(() => {
    const t = setTimeout(() => paged.setSearch(searchInput), 300);
    return () => clearTimeout(t);
  }, [searchInput]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => { setSelectedId(null); }, [paged.page, paged.pageSize, paged.sort, paged.search]);

  const sortValue = paged.sort ? { key: 'page_date', direction: paged.sort.startsWith('-') ? 'desc' : 'asc' } : null;
  const handleSort = (v) => paged.setSort(v ? (v.direction === 'asc' ? 'page_date' : '-page_date') : null);

  const openFromBar = (edit) => { setPane({ note: selected, edit }); setSelectedId(null); };

  // A new note is created from the form modal, then opened for writing.
  // Failures are thrown back to the modal, which reports them and stays open.
  const handleCreate = async (fields) => {
    const created = await createNotePage(objectType, objectId, fields);
    paged.setPage(1);
    await invalidate();
    setCreating(false);
    setPane({ note: created, edit: true });
  };

  const handleSave = async (draft) => {
    try {
      await updateNotePage(pane.note.id, draft);
      await invalidate();
    } catch {
      toast({ title: 'Error', description: 'Failed to save note.', variant: 'destructive' });
    }
  };

  const handleDelete = async () => {
    try {
      await deleteNotePage(deleteNote.id);
      await invalidate();
      setDeleteNote(null);
      setSelectedId(null);
    } catch {
      toast({ title: 'Error', description: 'Failed to delete note.', variant: 'destructive' });
    }
  };

  return (
    <div>
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-4">
        <div>
          <h2 className="font-bold text-foreground text-lg">Notes</h2>
          <p className="text-sm text-muted-foreground mt-0.5">Document updates and organize important details</p>
        </div>
        <NotesToolbar
        search={searchInput}
        onSearchChange={setSearchInput}
        sort={sortValue}
        onSortChange={handleSort}
        action={
          <Button size="sm" className="font-medium gap-1.5 h-9 px-4 text-sm" onClick={() => setCreating(true)}>
            <Plus className="w-4 h-4" /> Add New Note
          </Button>
        }
        />
      </div>

      {paged.isLoading ? (
        <ModuleLoader />
      ) : paged.failure.isLoadingError ? (
        <LoadError failure={paged.failure} title="Couldn’t load notes" />
      ) : paged.notes.length === 0 ? (
        <div className={cn(ELEVATED_CARD, 'p-10 text-center')}>
          <p className="text-sm text-muted-foreground">
            {paged.search ? 'No notes match your search.' : 'No notes yet. Click "Add New Note" to get started.'}
          </p>
        </div>
      ) : (
        <div>
          <NotesTable
            notes={paged.notes}
            selectedId={selectedId}
            onSelect={setSelectedId}
            onOpen={(note) => { setSelectedId(null); setPane({ note, edit: false }); }}
          />
        </div>
      )}

      <Pagination
        page={paged.page}
        totalPages={paged.totalPages}
        total={paged.total}
        pageSize={paged.pageSize}
        onPageChange={paged.setPage}
        onPageSizeChange={paged.setPageSize}
      />

      <RowBulkBar
        count={selected && !pane && !deleteNote ? 1 : 0}
        onView={() => openFromBar(false)}
        onEdit={() => openFromBar(true)}
        onDelete={() => setDeleteNote(selected)}
        onClear={() => setSelectedId(null)}
      />

      <NotePagePane
        isOpen={!!pane}
        note={pane?.note || null}
        startEditing={pane?.edit}
        onClose={() => setPane(null)}
        onSave={handleSave}
      />

      <NoteFormModal isOpen={creating} defaultOwner={currentUser?.full_name} onConfirm={handleCreate} onCancel={() => setCreating(false)} />

      <DeleteNoteDialog note={deleteNote} onConfirm={handleDelete} onCancel={() => setDeleteNote(null)} />
    </div>
  );
}