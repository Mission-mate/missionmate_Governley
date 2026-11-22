import React, { useState } from 'react';
import { ListFilter, ArrowUpDown, Download } from 'lucide-react';
import ToolbarButton from '@/components/shared/table/ToolbarButton';
import FilterCountBadge from '@/components/shared/table/FilterCountBadge';
import ExportObligationsDialog from '@/components/compliance/ExportObligationsDialog';
import { exportAssetsToExcel, exportAssetsToPdf } from '@/lib/assetExport';
import AssetFilterMenu from './toolbar/AssetFilterMenu';
import AssetSortMenu from './toolbar/AssetSortMenu';
import AssetExportMenu from './toolbar/AssetExportMenu';
import AssetViewSwitcher from './AssetViewSwitcher';

export default function AssetToolbar({
  fields, sortFields, items, selectedItems, registerTitle,
  view, onViewChange,
  activeFilters, onApplyFilter, onClearFilter,
  sort, onApplySort, onClearSort,
}) {
  const [open, setOpen] = useState(null); // 'filter' | 'sort' | 'export'
  const [exportDialog, setExportDialog] = useState(null); // 'pdf' | 'excel'
  const filterCount = Object.keys(activeFilters).length;
  const disabled = view === 'charts';
  const toggle = (key) => setOpen((o) => (o === key ? null : key));
  const close = () => setOpen(null);

  const changeView = (v) => { close(); onViewChange(v); };

  const handleExport = (scope) => {
    const scoped = scope === 'all' ? items : scope === 'selected' ? selectedItems : items.filter((a) => a.status === scope);
    if (exportDialog === 'pdf') exportAssetsToPdf(scoped, registerTitle);
    else exportAssetsToExcel(scoped, registerTitle);
    setExportDialog(null);
  };

  return (
    <div className="flex items-center gap-2">
      <AssetViewSwitcher value={view} onChange={changeView} />
      <div className="relative">
        <ToolbarButton icon={ListFilter} label="Filter" disabled={disabled} active={!!filterCount} badge={<FilterCountBadge count={filterCount} />} onClick={() => toggle('filter')} />
        {!disabled && open === 'filter' && <AssetFilterMenu fields={fields} activeFilters={activeFilters} onApply={onApplyFilter} onClear={onClearFilter} onClose={close} />}
      </div>
      <div className="relative">
        <ToolbarButton icon={ArrowUpDown} label="Sort" disabled={disabled} active={!!sort} onClick={() => toggle('sort')} />
        {!disabled && open === 'sort' && <AssetSortMenu sortFields={sortFields} sort={sort} onApply={onApplySort} onClear={onClearSort} onClose={close} />}
      </div>
      <div className="relative">
        <ToolbarButton icon={Download} label="Export" disabled={disabled} onClick={() => toggle('export')} />
        {!disabled && open === 'export' && <AssetExportMenu onClose={close} onExcel={() => setExportDialog('excel')} onPdf={() => setExportDialog('pdf')} />}
      </div>

      <ExportObligationsDialog
        isOpen={!!exportDialog}
        format={exportDialog || 'pdf'}
        selectedCount={selectedItems.length}
        statusOptions={['Active', 'Disposed']}
        itemLabel="assets"
        onClose={() => setExportDialog(null)}
        onConfirm={handleExport}
      />
    </div>
  );
}