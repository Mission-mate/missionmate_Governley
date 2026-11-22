import React, { useState } from 'react';
import { Search, ListFilter } from 'lucide-react';
import ToolbarButton from '@/components/shared/table/ToolbarButton';
import FilterCountBadge from '@/components/shared/table/FilterCountBadge';
import AssetFilterMenu from '@/components/compliance/assets/toolbar/AssetFilterMenu';
import GroupByDropdown from '@/components/board/GroupByDropdown';
import SortMenu from '@/components/risk/register/SortMenu';
import ExportToolbarMenu from '@/components/shared/export/ExportToolbarMenu';

/** Search · Group · Filter · Sort · Export — the Risk Register toolbar for a WHS tab. */
export default function WhsToolbar({ cfg, search, onSearch, groupBy, onGroup, filters, onFilter, onClearFilters, sort, onSort, onExport, exporting }) {
  const [filterOpen, setFilterOpen] = useState(false);
  const filterCount = Object.keys(filters).length;
  return (
    <div className="flex flex-wrap items-center gap-2 shrink-0">
      <div className="relative w-full sm:w-64">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground/60" />
        <input value={search} onChange={(e) => onSearch(e.target.value)} placeholder={`Search ${cfg.label.toLowerCase()}...`}
          className="w-full pl-9 pr-3 h-9 border border-input bg-transparent text-sm outline-none focus:ring-1 focus:ring-ring placeholder:text-muted-foreground/50 rounded-[10px]" />
      </div>
      <GroupByDropdown options={cfg.groups} value={groupBy || 'none'} onChange={(k) => onGroup(k === 'none' ? null : k)} />
      {cfg.filters?.length > 0 && <div className="relative">
        <ToolbarButton icon={ListFilter} label="Filter" active={!!filterCount} badge={<FilterCountBadge count={filterCount} />} onClick={() => setFilterOpen((o) => !o)} />
        {filterOpen && <AssetFilterMenu fields={cfg.filters} activeFilters={filters} onApply={onFilter} onClear={onClearFilters} onClose={() => setFilterOpen(false)} />}
      </div>}
      <SortMenu options={cfg.sorts} sort={sort} onChange={onSort} />
      <ExportToolbarMenu exporting={exporting} onExportExcel={() => onExport('excel')} onExportPdf={() => onExport('pdf')} />
    </div>
  );
}