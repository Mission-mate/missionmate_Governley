import React, { useState } from 'react';
import { Search, ListFilter, ArrowUpDown, Download } from 'lucide-react';
import ToolbarButton from '@/components/shared/table/ToolbarButton';
import FilterCountBadge from '@/components/shared/table/FilterCountBadge';
import AssetFilterMenu from '@/components/compliance/assets/toolbar/AssetFilterMenu';
import AssetSortMenu from '@/components/compliance/assets/toolbar/AssetSortMenu';
import AssetExportMenu from '@/components/compliance/assets/toolbar/AssetExportMenu';

const FILTER_FIELDS = [{ id: 'person_type', label: 'Type', values: ['Board Member', 'Non-Board Member'] }];
const SORT_FIELDS = [{ id: 'term_expiry_date', label: 'Term Expiry' }];

/** Search / Committee filter / Term Expiry sort / Export for the Responsible People register. */
export default function ResponsiblePeopleToolbar({ search, onSearch, filters, onFilters, sort, onSort, onExcel, onPdf }) {
  const [open, setOpen] = useState(null); // 'filter' | 'sort' | 'export'
  const close = () => setOpen(null);
  const toggle = (m) => setOpen((o) => (o === m ? null : m));
  const count = Object.keys(filters).length;
  const applyFilter = (id, v) => { const n = { ...filters }; if (v) n[id] = v; else delete n[id]; onFilters(n); };

  return (
    <div className="flex items-center gap-3">
      <div className="relative w-64 shrink-0">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground/60" />
        <input value={search} onChange={(e) => onSearch(e.target.value)} placeholder="Search by name..."
          className="w-full pl-9 pr-3 h-9 border border-input bg-transparent text-sm outline-none focus:ring-1 focus:ring-ring placeholder:text-muted-foreground/50 rounded-[10px]" />
      </div>
      <div className="relative">
        <ToolbarButton icon={ListFilter} label="Filter" active={!!count} badge={<FilterCountBadge count={count} />} onClick={() => toggle('filter')} />
        {open === 'filter' && <AssetFilterMenu fields={FILTER_FIELDS} activeFilters={filters} onApply={applyFilter} onClear={() => onFilters({})} onClose={close} />}
      </div>
      <div className="relative">
        <ToolbarButton icon={ArrowUpDown} label="Sort" active={!!sort} onClick={() => toggle('sort')} />
        {open === 'sort' && <AssetSortMenu sort={sort} sortFields={SORT_FIELDS} onApply={onSort} onClear={() => onSort(null)} onClose={close} />}
      </div>
      <div className="relative">
        <ToolbarButton icon={Download} label="Export" onClick={() => toggle('export')} />
        {open === 'export' && <AssetExportMenu onClose={close} onExcel={onExcel} onPdf={onPdf} />}
      </div>
    </div>
  );
}