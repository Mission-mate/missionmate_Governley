import React, { useState } from 'react';
import { guardAction } from '@/lib/saveGuard';
import { useQuery } from '@tanstack/react-query';
import { Plus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { LoaderOne } from '@/components/ui/loaders';
import LoadError from '@/components/shared/states/LoadError';
import { ELEVATED_SECTION } from '@/components/shared/cardStyles';
import ConfirmTypeDialog from '@/components/board/documents/ConfirmTypeDialog';
import AssetBulkBar from '@/components/compliance/assets/AssetBulkBar';
import { listVariations, variationsKey, revertChange, deleteVariation } from '@/lib/contractVariations';
import VariationTable from './VariationTable';
import Pagination from '@/components/shared/Pagination';
import VariationPane from './VariationPane';
import RevertVariationDialog from './RevertVariationDialog';

/** Contract Variations tab: single-select table, action bar, add / view → edit pane, delete. */
export default function VariationsTab({ contract, onChanged }) {
  const [pane, setPane] = useState(null); // null | { variation, edit }
  const [selectedId, setSelectedId] = useState(null);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [revert, setRevert] = useState(null);
  const { data: items = [], isLoading, isLoadingError, isFetching, refetch } = useQuery({
    queryKey: variationsKey(contract.id),
    queryFn: () => listVariations(contract.id),
  });
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(50);
  const totalPages = Math.max(1, Math.ceil(items.length / pageSize));
  const currentPage = Math.min(page, totalPages);
  const paged = items.slice((currentPage - 1) * pageSize, currentPage * pageSize);
  const selected = items.find((v) => v.id === selectedId) || null;

  const handleSaved = async (saved) => {
    await Promise.all([refetch(), onChanged()]);
    if (pane?.variation) setPane({ variation: saved });
  };

  const open = (variation, edit = false) => { setSelectedId(null); setPane({ variation, edit }); };

  const finishDelete = async (doRevert) => {
    await deleteVariation(selected, contract, doRevert);
    setRevert(null); setSelectedId(null);
    await Promise.all([refetch(), onChanged()]);
  };

  const confirmDelete = guardAction(async () => {
    setDeleteOpen(false);
    const change = revertChange(selected, contract);
    if (change) setRevert(change); else await finishDelete(false);
  }, 'Could not delete the variation');

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-base font-bold text-foreground">Contract Variations</h3>
          <p className="text-xs text-muted-foreground mt-0.5">Record any change to value, scope or end date so the current terms are always clear.</p>
        </div>
        <Button onClick={() => open(null, true)}><Plus className="w-4 h-4" /> Add Variation</Button>
      </div>
      {isLoading ? (
        <div className="border border-border rounded-xl py-12 flex justify-center"><LoaderOne /></div>
      ) : isLoadingError ? (
        <LoadError failure={{ isFetching, refetch }} title="Couldn’t load variations" />
      ) : items.length ? (
        <>
          <VariationTable items={paged} onOpen={(v) => open(v)} selectedId={selectedId}
            onSelect={(id) => setSelectedId((s) => (s === id ? null : id))} />
          <Pagination page={currentPage} totalPages={totalPages} total={items.length} pageSize={pageSize}
            onPageChange={(p) => { setPage(p); setSelectedId(null); }} onPageSizeChange={(s) => { setPageSize(s); setPage(1); setSelectedId(null); }} />
        </>
      ) : (
        <div className={ELEVATED_SECTION}>
          <p className="text-sm text-muted-foreground">No variations yet. A variation that changes the value can update the current contract value, which the payment schedule must then match.</p>
        </div>
      )}
      <VariationPane isOpen={!!pane} variation={pane?.variation || null} startInEdit={!!pane?.edit} contract={contract} onClose={() => setPane(null)} onSaved={handleSaved} />
      <ConfirmTypeDialog
        isOpen={deleteOpen}
        title="Delete Variation"
        message={`Permanently delete "${selected?.title || ''}"? This cannot be recovered.`}
        keyword="DELETE"
        confirmLabel="Delete"
        onConfirm={confirmDelete}
        onClose={() => setDeleteOpen(false)}
      />
      {selected && <RevertVariationDialog change={revert} contract={contract} onChoose={finishDelete} onClose={() => setRevert(null)} />}
      <AssetBulkBar
        count={pane || deleteOpen || revert ? 0 : selected ? 1 : 0}
        onView={() => open(selected)}
        onEdit={() => open(selected, true)}
        onDelete={() => setDeleteOpen(true)}
        onClear={() => setSelectedId(null)}
      />
    </div>
  );
}