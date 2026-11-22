import React, { useState, useMemo, useEffect } from 'react';
import { FolderPlus, Upload } from 'lucide-react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Button } from '@/components/ui/button';
import { useToast } from '@/components/ui/use-toast';
import { cn } from '@/lib/utils';
import { ELEVATED_CARD } from '@/components/shared/cardStyles';
import ModuleLoader from '@/components/shared/states/ModuleLoader';
import LoadError from '@/components/shared/states/LoadError';
import { loadFailure } from '@/lib/readState';
import { DEFAULT_DOC_ENTITIES, folderLastUpdated } from '@/lib/documentFolders';
import AddDocumentModal from './AddDocumentModal';
import FolderFormModal from './FolderFormModal';
import DeleteFolderDialog from './DeleteFolderDialog';
import DocumentFolderList from './DocumentFolderList';
import FolderDetailView from './FolderDetailView';
import DocumentFolderTable from './DocumentFolderTable';
import Pagination from '@/components/shared/Pagination';
import FolderDetailPane from './FolderDetailPane';
import SelectionActionBar from './SelectionActionBar';
import { PAGER_SIZE } from './FolderPager';

// Documents whose folder no longer exists stay reachable through this virtual folder.
const UNSORTED = { id: 'unsorted', name: 'Unsorted', color: 'orange' };

/**
 * Folder-organised document repository for one record. Opening a folder shows its
 * focused detail view: in place inside side panes (`compact`), in a side pane on full pages.
 * Side panes list folders as divided rows ending in a "New folder" row, and upload from inside an open folder.
 */
export default function DocumentsTab({ objectType, objectId, currentUser, hideTitle = false, readOnly = false, compact = false, entities = DEFAULT_DOC_ENTITIES, heading, documentDefaults }) {
  const qc = useQueryClient();
  const { toast } = useToast();
  const [openFolderId, setOpenFolderId] = useState(null);
  const [selectedFolderId, setSelectedFolderId] = useState(null);
  const [folderForm, setFolderForm] = useState(null); // { mode, folder }
  const [deleteFolder, setDeleteFolder] = useState(null);
  const [showAddDoc, setShowAddDoc] = useState(false);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(50);

  const Folders = base44.entities[entities.folder];
  const Documents = base44.entities[entities.document];
  const scope = { object_type: objectType, object_id: objectId };

  useEffect(() => { setOpenFolderId(null); setSelectedFolderId(null); setPage(1); }, [objectType, objectId]);

  const { data: folders = [], isLoading: foldersLoading, ...foldersRead } = useQuery({
    queryKey: ['folders', objectType, objectId],
    queryFn: () => Folders.filter(scope),
    enabled: !!objectId
  });

  const { data: documents = [], isLoading: docsLoading, ...docsRead } = useQuery({
    queryKey: ['documents', objectType, objectId],
    queryFn: () => Documents.filter(scope),
    enabled: !!objectId
  });

  const failure = loadFailure(foldersRead, docsRead);

  // Group once per data change.
  const { byFolder, unsorted } = useMemo(() => {
    const ids = new Set(folders.map((f) => f.id));
    const grouped = {};
    const loose = [];
    documents.forEach((d) => {
      if (ids.has(d.folder_id)) (grouped[d.folder_id] ||= []).push(d);
      else loose.push(d);
    });
    return { byFolder: grouped, unsorted: loose };
  }, [folders, documents]);

  // Derived, so a folder or selection that no longer exists simply closes.
  const openFolder = openFolderId === UNSORTED.id ? UNSORTED : folders.find((f) => f.id === openFolderId) || null;
  const openDocs = openFolder === UNSORTED ? unsorted : byFolder[openFolder?.id] || [];
  const selectedFolder = readOnly ? null : folders.find((f) => f.id === selectedFolderId) || null;

  // One row per folder, plus the virtual Unsorted folder when it holds documents.
  // lastUpdated is the same date the folder's detail view shows.
  const folderRows = useMemo(() => [
    ...folders.map((folder) => {
      const docs = byFolder[folder.id] || [];
      return { folder, count: docs.length, lastUpdated: folderLastUpdated(folder, docs), selectable: true };
    }),
    ...(unsorted.length > 0 ? [{ folder: UNSORTED, count: unsorted.length, lastUpdated: folderLastUpdated(UNSORTED, unsorted), selectable: false }] : [])
  ], [folders, byFolder, unsorted]);
  // Side-pane folder lists page in fixed steps; full pages use the page-size picker.
  const perPage = compact ? PAGER_SIZE : pageSize;
  const totalPages = Math.max(1, Math.ceil(folderRows.length / perPage));
  const safePage = Math.min(page, totalPages);
  const pageRows = folderRows.slice((safePage - 1) * perPage, safePage * perPage);
  const changePage = (p) => { setPage(p); setSelectedFolderId(null); };

  // The tab badge counts folders, so a folder change refreshes it too.
  const invalidateFolders = () => Promise.all([
    qc.invalidateQueries({ queryKey: ['folders', objectType, objectId] }),
    qc.invalidateQueries({ queryKey: ['documents', objectType, objectId, 'count'] })
  ]);
  const invalidateDocs = () => qc.invalidateQueries({ queryKey: ['documents', objectType, objectId] });

  const openFolderById = (id) => { setSelectedFolderId(null); setOpenFolderId(id); };

  // Errors surface through the folder form's own failure toast.
  const handleFolderSave = async (name, color) => {
    if (folderForm.mode === 'edit') await Folders.update(folderForm.folder.id, { name, color });
    else await Folders.create({ ...scope, name, color });
    await invalidateFolders();
    setFolderForm(null);
    setSelectedFolderId(null);
  };

  // Removed on the server: the documents inside go first, the folder only once they are gone.
  const handleDeleteFolder = async () => {
    try {
      await base44.functions.invoke('deleteDocumentFolder', { folderId: deleteFolder.id, entity: entities.folder });
      setDeleteFolder(null);
      setSelectedFolderId(null);
    } catch (err) {
      toast({ title: 'Error', description: 'Failed to delete folder.', variant: 'destructive' });
    }
    await Promise.all([invalidateFolders(), invalidateDocs()]);
  };

  const detailProps = { docs: openDocs, folders, entity: entities.document, readOnly, onChanged: invalidateDocs };
  const btn = 'h-9 px-4 text-sm font-medium gap-1.5';

  // Full-page header actions; side panes create folders from the list and upload inside a folder.
  const actions = !compact && !readOnly &&
    <div className="flex items-center gap-2">
      <Button variant="outline" size="sm" className={cn(btn, 'bg-secondary')} onClick={() => setFolderForm({ mode: 'create' })}>
        <FolderPlus className="w-4 h-4" />
        New Folder
      </Button>
      <Button size="sm" className={btn} onClick={() => setShowAddDoc(true)}>
        <Upload className="w-4 h-4" />
        Upload Document
      </Button>
    </div>;

  return (
    <div>
      {!compact && !(readOnly && hideTitle) &&
        <div className={cn('flex items-start mb-4 gap-4 flex-wrap', hideTitle ? 'justify-end' : 'justify-between')}>
          {!hideTitle && (heading ||
            <div>
              <h2 className="font-bold text-foreground text-lg">Document Repository</h2>
              <p className="text-sm text-muted-foreground mt-0.5">Store files and keep them organised in folders</p>
            </div>)}
          {actions}
        </div>
      }

      {foldersLoading || docsLoading ?
        <ModuleLoader /> :
        failure.isLoadingError ?
          <LoadError failure={failure} title="Couldn’t load documents" /> :
          compact && openFolder ?
            <FolderDetailView key={openFolder.id} folder={openFolder} {...detailProps} onBack={() => setOpenFolderId(null)} onUpload={readOnly || openFolder === UNSORTED ? undefined : () => setShowAddDoc(true)} /> :
            <div className={cn(compact && 'flex flex-col min-h-[50vh]')}>
              {folders.length === 0 && unsorted.length === 0 && (!compact || readOnly) ?
                <div className={cn(ELEVATED_CARD, 'p-10 text-center')}>
                  <p className="text-sm text-muted-foreground">{readOnly ? 'No documents.' : 'No documents yet. Create a folder, then click "Upload Document" to add one.'}</p>
                </div> :
                compact ?
                  <DocumentFolderList
                    rows={pageRows}
                    page={safePage}
                    totalPages={totalPages}
                    onPageChange={changePage}
                    selectedId={selectedFolder?.id}
                    onSelect={readOnly ? undefined : (id) => setSelectedFolderId((cur) => (cur === id ? null : id))}
                    onOpen={openFolderById}
                    onNewFolder={readOnly ? undefined : () => setFolderForm({ mode: 'create' })} /> :
                  <DocumentFolderTable
                    rows={pageRows}
                    selectedId={selectedFolder?.id}
                    onSelect={readOnly ? undefined : setSelectedFolderId}
                    onOpen={openFolderById} />
              }
              {!compact &&
                <Pagination
                  page={safePage}
                  totalPages={totalPages}
                  total={folderRows.length}
                  pageSize={pageSize}
                  onPageChange={changePage}
                  onPageSizeChange={(s) => { setPageSize(s); setPage(1); setSelectedFolderId(null); }} />
              }
              <SelectionActionBar
                open={!!selectedFolder}
                floating={!compact}
                onOpen={() => openFolderById(selectedFolder.id)}
                onEdit={() => setFolderForm({ mode: 'edit', folder: selectedFolder })}
                onDelete={() => setDeleteFolder(selectedFolder)}
                onClear={() => setSelectedFolderId(null)} />
            </div>
      }

      {!compact && <FolderDetailPane folder={openFolder} {...detailProps} onClose={() => setOpenFolderId(null)} />}

      <FolderFormModal
        isOpen={!!folderForm}
        mode={folderForm?.mode}
        initialName={folderForm?.folder?.name || ''}
        initialColor={folderForm?.folder?.color || 'orange'}
        onConfirm={handleFolderSave}
        onCancel={() => setFolderForm(null)} />
      <DeleteFolderDialog folder={deleteFolder} onConfirm={handleDeleteFolder} onCancel={() => setDeleteFolder(null)} />

      <AddDocumentModal
        isOpen={showAddDoc}
        onClose={() => setShowAddDoc(false)}
        folders={folders}
        defaultFolderId={folders.some((f) => f.id === openFolderId) ? openFolderId : ''}
        objectType={objectType}
        objectId={objectId}
        currentUser={currentUser}
        documentEntity={entities.document}
        extraFields={documentDefaults}
        onSaved={invalidateDocs} />
    </div>
  );
}