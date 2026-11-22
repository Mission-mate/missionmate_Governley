import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Plus } from 'lucide-react';
import { base44 } from '@/api/base44Client';
import { Button } from '@/components/ui/button';
import { LoaderOne } from '@/components/ui/loaders';
import LoadError from '@/components/shared/states/LoadError';
import { useToast } from '@/components/ui/use-toast';
import { ELEVATED_SECTION } from '@/components/shared/cardStyles';
import Pagination from '@/components/shared/Pagination';
import ConfirmTypeDialog from '@/components/board/documents/ConfirmTypeDialog';
import AssetBulkBar from '@/components/compliance/assets/AssetBulkBar';
import { listVersions, versionsKey, deleteVersion } from '@/lib/policyVersions';
import VersionTable from './VersionTable';
import VersionPane from './VersionPane';
import CurrentVersionDeleteBlocked from './CurrentVersionDeleteBlocked';

/** Document Versions tab: single-select table, action bar, one view / edit / add pane, delete. */
export default function VersionsTab({ doc, onChanged }) {
  const { toast } = useToast();
  // The pane keeps its last target while closing, so its content stays put during the slide-out.
  const [pane, setPane] = useState({ id: null, editing: true });
  const [paneOpen, setPaneOpen] = useState(false);
  const [selectedId, setSelectedId] = useState(null);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [blocked, setBlocked] = useState(false);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(50);
  const { data: items = [], isLoading, isLoadingError, isFetching, refetch } = useQuery({ queryKey: versionsKey(doc.id), queryFn: () => listVersions(doc) });
  const totalPages = Math.max(1, Math.ceil(items.length / pageSize));
  const currentPage = Math.min(page, totalPages);
  const paged = items.slice((currentPage - 1) * pageSize, currentPage * pageSize);
  const selected = items.find((v) => v.id === selectedId) || null;
  const paneVersion = items.find((v) => v.id === pane.id) || null;
  const openPane = (version, editing) => { setSelectedId(null); setPane({ id: version?.id || null, editing }); setPaneOpen(true); };

  const changed = () => Promise.all([refetch(), onChanged()]);
  const confirmDelete = async () => {
    setDeleteOpen(false);
    try { await deleteVersion(selected); setSelectedId(null); await changed(); }
    catch (e) { toast({ title: "Couldn't delete version", description: e.message, variant: 'destructive' }); }
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between gap-4">
        <div>
          <h3 className="text-base font-bold text-foreground">Document Versions</h3>
          <p className="text-xs text-muted-foreground mt-0.5">Upload new versions of this document. Only the Current version is shown in Preview and used by the assistant.</p>
        </div>
        <Button onClick={() => openPane(null, true)}><Plus className="w-4 h-4" /> Add New Version</Button>
      </div>
      {isLoading ? (
        <div className="border border-border rounded-xl py-12 flex justify-center"><LoaderOne /></div>
      ) : isLoadingError ? (
        <LoadError failure={{ isFetching, refetch }} title="Couldn’t load versions" />
      ) : items.length ? (
        <>
          <VersionTable items={paged} selectedId={selectedId} onOpen={(v) => openPane(v, false)}
            onSelect={(id) => setSelectedId((s) => (s === id ? null : id))} />
          <Pagination page={currentPage} totalPages={totalPages} total={items.length} pageSize={pageSize}
            onPageChange={(p) => { setPage(p); setSelectedId(null); }} onPageSizeChange={(s) => { setPageSize(s); setPage(1); setSelectedId(null); }} />
        </>
      ) : (
        <div className={ELEVATED_SECTION}><p className="text-sm text-muted-foreground">No versions yet. Upload a document to create the first Current version.</p></div>
      )}
      <VersionPane isOpen={paneOpen} version={paneVersion} startEditing={pane.editing} policyId={doc.id} onClose={() => setPaneOpen(false)} onSaved={changed} />
      <ConfirmTypeDialog isOpen={deleteOpen} title="Delete Version" keyword="DELETE" confirmLabel="Delete"
        message={`Permanently delete version ${selected?.version_number || ''}? This cannot be recovered.`}
        onConfirm={confirmDelete} onClose={() => setDeleteOpen(false)} />
      <CurrentVersionDeleteBlocked isOpen={blocked} onClose={() => setBlocked(false)} />
      <AssetBulkBar count={paneOpen || deleteOpen || blocked ? 0 : selected ? 1 : 0}
        onView={() => openPane(selected, false)}
        onEdit={() => openPane(selected, true)}
        onExport={selected?.file_uri ? async () => {
          const { signed_url } = await base44.integrations.Core.CreateFileSignedUrl({ file_uri: selected.file_uri });
          const blob = await (await fetch(signed_url)).blob();
          const a = document.createElement('a');
          a.href = URL.createObjectURL(blob);
          a.download = selected.file_name || 'document';
          a.click();
          URL.revokeObjectURL(a.href);
        } : undefined}
        onDelete={() => (selected?.status === 'Current' ? setBlocked(true) : setDeleteOpen(true))} onClear={() => setSelectedId(null)} />
    </div>
  );
}