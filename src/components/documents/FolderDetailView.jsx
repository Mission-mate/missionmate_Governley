import React, { useState, useMemo } from 'react';
import { ChevronLeft, ArrowDown, ArrowUp, Upload } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { base44 } from '@/api/base44Client';
import { toast } from '@/components/ui/use-toast';
import { openDocument, downloadDocument } from '@/lib/documentStorage';
import ConfirmTypeDialog from '@/components/board/documents/ConfirmTypeDialog';
import ViewBoardDocumentModal from '@/components/board/documents/ViewBoardDocumentModal';
import { cn } from '@/lib/utils';
import FolderSummary from './FolderSummary';
import FolderFileRow from './FolderFileRow';
import FolderPager, { PAGER_SIZE } from './FolderPager';
import SelectionActionBar from './SelectionActionBar';
import EditDocumentModal from './EditDocumentModal';

const HEAD = 'text-[11px] font-semibold uppercase tracking-wider text-muted-foreground';

/**
 * Focused view of one folder's sortable file list. With `onBack` (in place inside a side pane)
 * it leads with a breadcrumb back link and the folder summary; without it the host pane's
 * header carries the summary and the list header divider runs edge to edge.
 * `onUpload` adds an Upload button beside the folder summary.
 */
export default function FolderDetailView({ folder, docs, folders, entity = 'Document', readOnly = false, onBack, onUpload, onChanged, className }) {
  const [newestFirst, setNewestFirst] = useState(true);
  const [selectedId, setSelectedId] = useState(null);
  const [page, setPage] = useState(1);
  const [viewDoc, setViewDoc] = useState(null);
  const [editDoc, setEditDoc] = useState(null);
  const [deleteDoc, setDeleteDoc] = useState(null);

  // Newest first by default; the id breaks ties so the order never shuffles.
  const sorted = useMemo(() => {
    const list = [...docs].sort((a, b) =>
      (b.created_date || '').localeCompare(a.created_date || '') || b.id.localeCompare(a.id));
    return newestFirst ? list : list.reverse();
  }, [docs, newestFirst]);

  // The page is clamped, so deleting the last file on a page falls back to the previous one.
  const totalPages = Math.max(1, Math.ceil(sorted.length / PAGER_SIZE));
  const safePage = Math.min(page, totalPages);
  const pageDocs = sorted.slice((safePage - 1) * PAGER_SIZE, safePage * PAGER_SIZE);
  // Changing page or sort order clears the selection, so the action bar never acts on a hidden file.
  const changePage = (p) => { setPage(p); setSelectedId(null); };

  // A document that was deleted or moved out of this folder drops its selection.
  const selected = readOnly ? null : docs.find((d) => d.id === selectedId) || null;
  const SortIcon = newestFirst ? ArrowDown : ArrowUp;

  const handleDelete = async () => {
    try {
      await base44.entities[entity].delete(deleteDoc.id);
      setDeleteDoc(null);
      setSelectedId(null);
    } catch (err) {
      toast({ variant: 'destructive', title: 'Couldn’t delete document', description: 'Something went wrong. Please try again.' });
    }
    await onChanged();
  };

  return (
    <div className={cn('flex flex-col min-h-[50vh]', className)}>
      {onBack &&
        <div className="pane-bleed-divider flex items-center gap-3 pb-3 text-sm min-w-0">
          <button type="button" onClick={onBack} className="flex items-center gap-1 font-semibold text-foreground hover:text-primary transition-colors shrink-0">
            <ChevronLeft className="w-4 h-4" /> All documents
          </button>
          <span className="w-px h-4 bg-border shrink-0" />
          <span className="text-foreground truncate">{folder.name}</span>
        </div>
      }

      {onBack &&
        <div className="flex items-center justify-between gap-3 py-5">
          <FolderSummary folder={folder} docs={docs} />
          {onUpload &&
            <Button size="sm" className="h-8 px-3 text-xs font-medium gap-1.5 shrink-0" onClick={onUpload}>
              <Upload className="w-4 h-4" />
              Upload
            </Button>
          }
        </div>
      }

      {docs.length === 0 ?
        <p className={cn('text-sm text-muted-foreground text-center py-8', onBack && 'border-t border-border')}>No documents in this folder.</p> :
        <>
          <div className={cn('flex items-center gap-3 pb-2.5', onBack ? 'border-b border-border' : 'pane-bleed-divider')}>
            {!readOnly && <span className="w-5 shrink-0" />}
            <span className="w-9 shrink-0" />
            <button type="button" onClick={() => { setNewestFirst((v) => !v); changePage(1); }} title={newestFirst ? 'Newest first' : 'Oldest first'} className={cn(HEAD, 'flex items-center gap-1 hover:text-foreground transition-colors')}>
              Name <SortIcon className="w-3 h-3" />
            </button>
            {totalPages > 1 &&
              <div className="ml-auto">
                <FolderPager page={safePage} totalPages={totalPages} onPageChange={changePage} />
              </div>
            }
          </div>
          {pageDocs.map((doc) =>
            <FolderFileRow
              key={doc.id}
              doc={doc}
              selected={doc.id === selectedId}
              onSelect={readOnly ? undefined : () => setSelectedId((id) => (id === doc.id ? null : doc.id))}
              onView={() => setViewDoc(doc)}
              onOpen={() => openDocument(doc, entity)}
              onDownload={() => downloadDocument(doc, entity)} />
          )}
        </>
      }

      <SelectionActionBar
        open={!!selected}
        canOpen={!!selected?.file_url}
        onView={() => setViewDoc(selected)}
        onOpen={() => openDocument(selected, entity)}
        onDownload={() => downloadDocument(selected, entity)}
        onEdit={() => setEditDoc(selected)}
        onDelete={() => setDeleteDoc(selected)}
        onClear={() => setSelectedId(null)} />

      <ViewBoardDocumentModal doc={viewDoc} entity={entity} onClose={() => setViewDoc(null)} />
      <EditDocumentModal doc={editDoc} folders={folders} entity={entity} onSaved={onChanged} onClose={() => setEditDoc(null)} />
      <ConfirmTypeDialog
        isOpen={!!deleteDoc}
        title="Delete Document"
        message={<>This action cannot be undone. This will permanently delete <span className="font-bold text-foreground">{deleteDoc?.title}</span>.</>}
        onConfirm={handleDelete}
        onClose={() => setDeleteDoc(null)} />
    </div>
  );
}