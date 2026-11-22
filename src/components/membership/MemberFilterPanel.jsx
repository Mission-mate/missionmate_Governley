import React, { useState } from 'react';
import { ListFilter, ChevronRight, ChevronLeft, Check, Save } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Popover, PopoverContent, PopoverTrigger,
} from '@/components/ui/popover';
import { useToast } from '@/components/ui/use-toast';
import FilterFooter from '@/components/shared/filter/FilterFooter';
import ToolbarButton from '@/components/shared/table/ToolbarButton';
import FilterCountBadge from '@/components/shared/table/FilterCountBadge';
import { cn } from '@/lib/utils';
import { getTagPillClasses } from '@/lib/tagColors';

const STATUS_OPTIONS = [
  { value: 'active', label: 'Active' },
  { value: 'pending', label: 'Pending' },
  { value: 'expired', label: 'Expired' },
];

// A single row on the main "Filter By" list — drills into a category.
function CategoryRow({ label, count, onClick }) {
  return (
    <button
      onClick={onClick}
      className="w-full flex items-center justify-between px-3 py-2.5 hover:bg-muted/50 transition-colors text-left"
    >
      <span className="text-sm text-foreground flex items-center gap-2">
        {label}
        {count > 0 && (
          <span className="text-[11px] font-semibold text-primary bg-primary/10 rounded-full px-1.5 py-0.5 leading-none">{count}</span>
        )}
      </span>
      <ChevronRight className="w-4 h-4 text-muted-foreground" />
    </button>
  );
}

// A checkbox-style option row inside a category page.
function OptionRow({ label, checked, onClick, children }) {
  return (
    <button
      onClick={onClick}
      className="w-full flex items-center justify-between gap-2 px-3 py-2.5 hover:bg-muted/50 transition-colors text-left"
    >
      {children || <span className="text-sm text-foreground truncate">{label}</span>}
      {checked && <Check className="w-4 h-4 text-primary shrink-0" strokeWidth={2.5} />}
    </button>
  );
}

export default function MemberFilterPanel({ filters, setFilters, structures, tags, onSaveSmartList }) {
  const { toast } = useToast();
  const [activeCat, setActiveCat] = useState(null); // null = main "Filter By" list
  const [open, setOpen] = useState(false);
  const [showSave, setShowSave] = useState(false);
  const [savingName, setSavingName] = useState('');

  const toggleInArray = (key, value) => {
    setFilters((prev) => {
      const arr = new Set(prev[key] || []);
      if (arr.has(value)) arr.delete(value);
      else arr.add(value);
      return { ...prev, [key]: [...arr] };
    });
  };

  const activeCount =
    (filters.status?.length || 0) +
    (filters.membership_structure_id?.length || 0) +
    (filters.tags?.length || 0);

  const clearAll = () => setFilters((prev) => ({
    ...prev,
    status: [], membership_structure_id: [], tags: [],
  }));

  // Clear only the currently open category, keeping all other filters intact.
  const clearActiveCategory = () => {
    if (!activeCat) return;
    setFilters((prev) => {
      if (activeCat === 'status') return { ...prev, status: [] };
      if (activeCat === 'structure') return { ...prev, membership_structure_id: [] };
      if (activeCat === 'tags') return { ...prev, tags: [] };
      return prev;
    });
  };

  const applyAndClose = () => { setOpen(false); setActiveCat(null); };

  const handleSaveSmartList = async () => {
    if (!savingName.trim()) return;
    await onSaveSmartList(savingName.trim(), {
      status: filters.status || [],
      membership_structure_id: filters.membership_structure_id || [],
      tags: filters.tags || [],
    });
    toast({ title: 'Smart group saved', description: `"${savingName.trim()}" added to Groups.` });
    setSavingName('');
    setShowSave(false);
  };

  // Category registry — id, label, active count, and a render fn for its options page.
  const categories = [
    {
      id: 'status', label: 'Status', count: filters.status?.length || 0,
      render: () => STATUS_OPTIONS.map((o) => (
        <OptionRow key={o.value} label={o.label}
          checked={(filters.status || []).includes(o.value)}
          onClick={() => toggleInArray('status', o.value)} />
      )),
    },
    {
      id: 'structure', label: 'Membership Plan', count: filters.membership_structure_id?.length || 0,
      render: () => structures.length === 0
        ? <p className="text-xs text-muted-foreground px-3 py-2">No plans available.</p>
        : structures.map((s) => (
            <OptionRow key={s.id} label={s.name}
              checked={(filters.membership_structure_id || []).includes(s.id)}
              onClick={() => toggleInArray('membership_structure_id', s.id)} />
          )),
    },
    {
      id: 'tags', label: 'Tags', count: filters.tags?.length || 0,
      render: () => tags.length === 0
        ? <p className="text-xs text-muted-foreground px-3 py-2">No tags available.</p>
        : tags.map((t) => (
            <OptionRow key={t.id}
              checked={(filters.tags || []).includes(t.id)}
              onClick={() => toggleInArray('tags', t.id)}>
              <span className={getTagPillClasses(t.color)}>{t.name}</span>
            </OptionRow>
          )),
    },
  ];

  const active = categories.find((c) => c.id === activeCat);

  return (
    <Popover open={open} onOpenChange={(o) => { setOpen(o); if (!o) setActiveCat(null); }}>
      <PopoverTrigger asChild>
        <ToolbarButton
          icon={ListFilter}
          label="Filter"
          active={activeCount > 0}
          badge={<FilterCountBadge count={activeCount} />}
        />
      </PopoverTrigger>
      <PopoverContent align="end" className="w-64 p-0 max-h-[70vh] overflow-y-auto">
        {!active ? (
          <>
            <div className="px-3 py-2.5 border-b border-border">
              <span className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wide">Filter By</span>
            </div>
            <div className="py-1">
              {categories.map((c) => (
                <CategoryRow key={c.id} label={c.label} count={c.count} onClick={() => setActiveCat(c.id)} />
              ))}
            </div>

            {onSaveSmartList && (
              showSave ? (
                <div className="border-t border-border p-2 space-y-2">
                  <Input
                    autoFocus
                    placeholder="Smart group name"
                    value={savingName}
                    onChange={(e) => setSavingName(e.target.value)}
                    className="h-8 text-sm"
                  />
                  <div className="flex gap-2">
                    <Button size="sm" className="h-8 flex-1 text-xs" onClick={handleSaveSmartList} disabled={!savingName.trim() || activeCount === 0}>Save</Button>
                    <Button size="sm" variant="outline" className="h-8 text-xs" onClick={() => setShowSave(false)}>Cancel</Button>
                  </div>
                </div>
              ) : (
                <button
                  onClick={() => setShowSave(true)}
                  disabled={activeCount === 0}
                  className="w-full flex items-center gap-2 rounded-md px-3 py-2.5 text-sm text-primary hover:bg-accent border-t border-border disabled:opacity-40 transition-colors"
                >
                  <Save className="w-3.5 h-3.5" /> Save as Smart Group
                </button>
              )
            )}

            <FilterFooter onClear={clearAll} onApply={applyAndClose} count={activeCount} />
          </>
        ) : (
          <>
            <button
              onClick={() => setActiveCat(null)}
              className="w-full flex items-center gap-1.5 px-3 py-2.5 border-b border-border hover:bg-muted/50 transition-colors text-left"
            >
              <ChevronLeft className="w-4 h-4 text-muted-foreground" />
              <span className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wide">{active.label}</span>
            </button>
            <div className="py-1">{active.render()}</div>
            <FilterFooter onClear={clearActiveCategory} onApply={applyAndClose} />
          </>
        )}
      </PopoverContent>
    </Popover>
  );
}