import React, { useState } from 'react';
import { Search, ListFilter } from 'lucide-react';
import { Input } from '@/components/ui/input';
import ToolbarButton from '@/components/shared/table/ToolbarButton';
import FilterCountBadge from '@/components/shared/table/FilterCountBadge';
import AssetFilterMenu from '@/components/compliance/assets/toolbar/AssetFilterMenu';
import { POLICY_STAGES } from '@/lib/policies';

/** Search + register-style Filter (Document Type, Category, Stage). */
export default function PolicyToolbar({ search, onSearch, filters, onFilters, types, categories }) {
  const [open, setOpen] = useState(false);
  const fields = [
    { id: 'document_type', label: 'Document Type', values: types },
    { id: 'category', label: 'Category', values: categories },
    { id: 'stage', label: 'Stage', values: POLICY_STAGES },
  ];
  const setFilter = (id, v) => onFilters((f) => { const n = { ...f }; v ? (n[id] = v) : delete n[id]; return n; });
  const count = Object.keys(filters).length;
  return (
    <div className="flex items-center gap-2">
      <div className="relative">
        <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
        <Input value={search} onChange={(e) => onSearch(e.target.value)} placeholder="Search documents..." className="pl-9 h-9 w-64 bg-card" />
      </div>
      <div className="relative">
        <ToolbarButton icon={ListFilter} label="Filter" active={!!count} badge={<FilterCountBadge count={count} />} onClick={() => setOpen((o) => !o)} />
        {open && <AssetFilterMenu fields={fields} activeFilters={filters} onApply={setFilter} onClear={() => onFilters({})} onClose={() => setOpen(false)} />}
      </div>
    </div>
  );
}