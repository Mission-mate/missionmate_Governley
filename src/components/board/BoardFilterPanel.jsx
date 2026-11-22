import React, { useState, useMemo } from 'react';
import { ListFilter, ChevronRight, ChevronLeft, Check } from 'lucide-react';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import FilterFooter from '@/components/shared/filter/FilterFooter';
import ToolbarButton from '@/components/shared/table/ToolbarButton';
import FilterCountBadge from '@/components/shared/table/FilterCountBadge';
import { financialYearLabel } from '@/lib/boardMeetings';

// A single row on the main "Filter By" list — drills into a category.
function CategoryRow({ label, count, onClick }) {
  return (
    <button
      onClick={onClick}
      className="w-full flex items-center justify-between px-3 py-2.5 hover:bg-muted/50 transition-colors text-left">
      
      <span className="text-sm text-foreground flex items-center gap-2">
        {label}
        {count > 0 &&
        <span className="text-[11px] font-semibold text-primary bg-primary/10 rounded-full px-1.5 py-0.5 leading-none">{count}</span>
        }
      </span>
      <ChevronRight className="w-4 h-4 text-muted-foreground" />
    </button>);

}

function OptionRow({ label, checked, onClick }) {
  return (
    <button
      onClick={onClick}
      className="w-full flex items-center justify-between px-3 py-2.5 hover:bg-muted/50 transition-colors text-left">
      
      <span className="text-sm text-foreground truncate">{label}</span>
      {checked && <Check className="w-4 h-4 text-primary shrink-0" strokeWidth={2.5} />}
    </button>);

}

// Derive the distinct option values present in the given meetings, per category.
function buildOptions(meetings) {
  const committees = new Map();
  const financialYears = new Set();
  const calendarYears = new Set();
  meetings.forEach((m) => {
    if (m.committee_name) committees.set(m.committee_name, m.committee_name);
    financialYears.add(financialYearLabel(m.meeting_date));
    if (m.calendar_year) calendarYears.add(String(m.calendar_year));
  });
  return {
    committee: [...committees.values()].sort((a, b) => a.localeCompare(b)),
    financial_year: [...financialYears].sort((a, b) => b.localeCompare(a)),
    calendar_year: [...calendarYears].sort((a, b) => b.localeCompare(a))
  };
}

/**
 * Filter dropdown matching the Members database layout.
 * Filters by Meeting Committee, Financial Year and Calendar Year — the same
 * dimensions offered by the Group dropdown.
 *
 * filters shape: { committee: [], financial_year: [], calendar_year: [] }
 */
export default function BoardFilterPanel({ meetings, filters, setFilters, disabled = false }) {
  const [activeCat, setActiveCat] = useState(null);
  const [open, setOpen] = useState(false);

  const options = useMemo(() => buildOptions(meetings), [meetings]);

  const toggle = (key, value) => {
    setFilters((prev) => {
      const arr = new Set(prev[key] || []);
      if (arr.has(value)) arr.delete(value);else
      arr.add(value);
      return { ...prev, [key]: [...arr] };
    });
  };

  const activeCount =
  (filters.committee?.length || 0) + (
  filters.financial_year?.length || 0) + (
  filters.calendar_year?.length || 0);

  const clearAll = () => setFilters({ committee: [], financial_year: [], calendar_year: [] });

  const clearActiveCategory = () => {
    if (!activeCat) return;
    setFilters((prev) => ({ ...prev, [activeCat]: [] }));
  };

  const applyAndClose = () => {setOpen(false);setActiveCat(null);};

  const categories = [
  {
    id: 'committee', label: 'Meeting Committee', count: filters.committee?.length || 0,
    render: () => options.committee.length === 0 ?
    <p className="text-xs text-muted-foreground px-3 py-2">No committees available.</p> :
    options.committee.map((v) =>
    <OptionRow key={v} label={v} checked={(filters.committee || []).includes(v)} onClick={() => toggle('committee', v)} />
    )
  },
  {
    id: 'financial_year', label: 'Financial Year', count: filters.financial_year?.length || 0,
    render: () => options.financial_year.length === 0 ?
    <p className="text-xs text-muted-foreground px-3 py-2">No financial years available.</p> :
    options.financial_year.map((v) =>
    <OptionRow key={v} label={v} checked={(filters.financial_year || []).includes(v)} onClick={() => toggle('financial_year', v)} />
    )
  },
  {
    id: 'calendar_year', label: 'Calendar Year', count: filters.calendar_year?.length || 0,
    render: () => options.calendar_year.length === 0 ?
    <p className="text-xs text-muted-foreground px-3 py-2">No calendar years available.</p> :
    options.calendar_year.map((v) =>
    <OptionRow key={v} label={v} checked={(filters.calendar_year || []).includes(v)} onClick={() => toggle('calendar_year', v)} />
    )
  }];


  const active = categories.find((c) => c.id === activeCat);

  return (
    <Popover open={open && !disabled} onOpenChange={(o) => {if (disabled) return;setOpen(o);if (!o) setActiveCat(null);}}>
      <PopoverTrigger asChild>
        <span className={disabled ? 'opacity-50 pointer-events-none' : undefined}>
          <ToolbarButton
            icon={ListFilter}
            label="Filter"
            active={activeCount > 0}
            badge={<FilterCountBadge count={activeCount} />} />
        </span>
      </PopoverTrigger>
      <PopoverContent align="end" className="w-64 p-0 max-h-[70vh] overflow-y-auto">
        {!active ?
        <>
            <div className="px-3 py-2.5 border-b border-border">
              <span className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wide">Filter By</span>
            </div>
            <div className="py-1">
              {categories.map((c) =>
            <CategoryRow key={c.id} label={c.label} count={c.count} onClick={() => setActiveCat(c.id)} />
            )}
            </div>
            <FilterFooter onClear={clearAll} onApply={applyAndClose} count={activeCount} />
          </> :

        <>
            <button
            onClick={() => setActiveCat(null)}
            className="w-full flex items-center gap-1.5 px-3 py-2.5 border-b border-border hover:bg-muted/50 transition-colors text-left">
            
              <ChevronLeft className="w-4 h-4 text-muted-foreground" />
              <span className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wide">{active.label}</span>
            </button>
            <div className="py-1">{active.render()}</div>
            <FilterFooter onClear={clearActiveCategory} onApply={applyAndClose} />
          </>
        }
      </PopoverContent>
    </Popover>);

}