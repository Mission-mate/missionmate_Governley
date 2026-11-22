import React, { useState, useEffect } from 'react';
import { guardAction } from '@/lib/saveGuard';
import Pagination from '@/components/shared/Pagination';
import { useQueryClient } from '@tanstack/react-query';
import usePagedMaintenance from '@/hooks/usePagedMaintenance';
import MaintenanceToolbar from './MaintenanceToolbar';
import { Plus, Wrench } from 'lucide-react';
import { Button } from '@/components/ui/button';
import ModuleLoader from '@/components/shared/states/ModuleLoader';
import LoadError from '@/components/shared/states/LoadError';
import ConfirmDeleteDialog from '@/components/shared/ConfirmDeleteDialog';
import { ELEVATED_CARD } from '@/components/shared/cardStyles';
import { cn } from '@/lib/utils';
import { createMaintenance, updateMaintenance, deleteMaintenanceMany } from '@/lib/assetRegisterApi';
import MaintenancePane from './MaintenancePane';
import MaintenanceTable from './MaintenanceTable';
import MaintenanceBulkBar from './MaintenanceBulkBar';

export default function MaintenanceTab({ asset }) {
  const qc = useQueryClient();
  const [pane, setPane] = useState(null); // null | { entry?, editing? } — no entry means Add
  const [selectedIds, setSelectedIds] = useState([]);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const key = ['assetMaintenance', asset.id];
  const paged = usePagedMaintenance(key, asset.id);
  const pageEntries = paged.entries;
  const refresh = () => qc.invalidateQueries({ queryKey: key });
  const selectedEntry = pageEntries.find((e) => e.id === selectedIds[0]);
  const toggle = (id) => setSelectedIds((s) => (s.includes(id) ? [] : [id]));

  const [searchInput, setSearchInput] = useState('');
  useEffect(() => {
    const t = setTimeout(() => paged.setSearch(searchInput), 300);
    return () => clearTimeout(t);
  }, [searchInput]); // eslint-disable-line react-hooks/exhaustive-deps
  useEffect(() => { setSelectedIds([]); }, [paged.page, paged.pageSize, paged.sort, paged.search, asset.id]);

  const sortValue = paged.sort ? { key: 'date', direction: paged.sort.startsWith('-') ? 'desc' : 'asc' } : null;
  const handleSort = (v) => paged.setSort(v ? (v.direction === 'asc' ? 'date' : '-date') : null);

  const handleSave = async (form) => {
    if (pane.entry) await updateMaintenance(pane.entry.id, form);
    else await createMaintenance(asset, form);
    await refresh();
  };

  return (
    <div>
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-5">
        <div>
          <h2 className="text-lg font-bold text-foreground">Maintenance Log</h2>
          <p className="text-sm text-muted-foreground mt-0.5">Complete audit trail of past service and maintenance logs</p>
        </div>
        <MaintenanceToolbar search={searchInput} onSearchChange={setSearchInput} sort={sortValue} onSortChange={handleSort}
          action={<Button size="sm" className="h-9 px-4" onClick={() => setPane({})}><Plus className="w-4 h-4" /> Add Maintenance</Button>} />
      </div>
      {paged.isLoading ? <ModuleLoader /> : paged.failure.isLoadingError ? (
        <LoadError failure={paged.failure} title="Couldn’t load maintenance records" />
      ) : pageEntries.length === 0 ? (
        <div className={cn(ELEVATED_CARD, 'p-10 text-center')}>
          <Wrench className="w-8 h-8 mx-auto mb-3 text-muted-foreground/50" />
          <p className="text-sm text-muted-foreground">
            {paged.search ? 'No maintenance entries match your search.' : 'No maintenance recorded yet. Click "Add Maintenance" to log a service.'}
          </p>
        </div>
      ) : (
        <>
          <MaintenanceTable entries={pageEntries} selectedIds={selectedIds} onToggle={toggle} onOpen={(e) => { setSelectedIds([]); setPane({ entry: e }); }} />
          <Pagination page={paged.page} totalPages={paged.totalPages} total={paged.total} pageSize={paged.pageSize}
            onPageChange={paged.setPage} onPageSizeChange={paged.setPageSize} />
        </>
      )}
      <MaintenanceBulkBar
        count={pane ? 0 : selectedIds.length}
        onView={() => setPane({ entry: selectedEntry })}
        onEdit={() => setPane({ entry: selectedEntry, editing: true })}
        onDelete={() => setConfirmDelete(true)}
        onClear={() => setSelectedIds([])}
      />
      <MaintenancePane isOpen={!!pane} entry={pane?.entry} startEditing={pane?.editing} onClose={() => setPane(null)} onSave={handleSave} />
      <ConfirmDeleteDialog
        isOpen={confirmDelete}
        title={selectedIds.length > 1 ? 'Delete Maintenance Entries' : 'Delete Maintenance Entry'}
        message={selectedIds.length > 1 ? `Permanently delete these ${selectedIds.length} maintenance entries? This cannot be recovered.` : 'Permanently delete this maintenance entry? This cannot be recovered.'}
        requireKeyword="DELETE"
        onConfirm={guardAction(async () => { await deleteMaintenanceMany(selectedIds); await refresh(); setSelectedIds([]); setConfirmDelete(false); }, 'Could not delete the maintenance record')}
        onClose={() => setConfirmDelete(false)}
      />
    </div>
  );
}