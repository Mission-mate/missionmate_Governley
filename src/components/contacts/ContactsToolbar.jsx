import React, { useState, useRef, useEffect } from 'react';
import { Search, LayoutGrid, ListFilter } from 'lucide-react';
import { Input } from '@/components/ui/input';
import ToolbarButton from '@/components/shared/table/ToolbarButton';
import FilterCountBadge from '@/components/shared/table/FilterCountBadge';
import ContactFilterPanel from './ContactFilterPanel';
import SmartGroupPickerModal from '@/components/shared/SmartGroupPickerModal';

// Number of saved filter selections inside a contacts smart group.
const countContactFilters = (f = {}) =>
  (f.contactTypes?.length || 0) +
  (f.tags?.length || 0) +
  Object.values(f.custom || {}).reduce((sum, v) => sum + (v?.length || 0), 0);

export default function ContactsToolbar({
  searchQuery, onSearchChange,
  filters, onApplyFilters, onSaveSmartList,
  onSelectSmartList, onClearSmartList, activeSmartListId, exportSlot,
}) {
  const [showFilter, setShowFilter] = useState(false);
  const [showGroup, setShowGroup] = useState(false);
  const filterRef = useRef(null);

  useEffect(() => {
    const handler = (e) => {
      if (filterRef.current && !filterRef.current.contains(e.target)) setShowFilter(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const activeCount = countContactFilters(filters);

  return (
    <div className="flex items-center justify-between gap-4 mb-4">
      <div className="relative w-[360px]">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
        <Input
          placeholder="Search by name, email, or company..."
          value={searchQuery}
          onChange={e => onSearchChange(e.target.value)}
          className="pl-9 h-9 text-sm bg-background rounded-md"
        />
      </div>
      <div className="flex items-center gap-2">
        <ToolbarButton
          icon={LayoutGrid}
          label="Group"
          active={!!activeSmartListId}
          onClick={() => { setShowGroup(true); setShowFilter(false); }}
        />

        <div className="relative" ref={filterRef}>
          <ToolbarButton
            icon={ListFilter}
            label="Filter"
            active={activeCount > 0}
            badge={<FilterCountBadge count={activeCount} />}
            onClick={() => setShowFilter(v => !v)}
          />
          {showFilter && (
            <ContactFilterPanel
              filters={filters}
              onApply={onApplyFilters}
              onClose={() => setShowFilter(false)}
              onSaveSmartList={onSaveSmartList}
            />
          )}
        </div>

        {exportSlot}
      </div>

      <SmartGroupPickerModal
        isOpen={showGroup}
        onClose={() => setShowGroup(false)}
        objectType="contacts"
        activeId={activeSmartListId}
        onApply={onSelectSmartList}
        onClear={onClearSmartList}
        countFilters={countContactFilters}
      />
    </div>
  );
}