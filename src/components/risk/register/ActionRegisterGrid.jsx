import React, { useState, useMemo, useEffect } from 'react';
import { Search } from 'lucide-react';
import { cn } from '@/lib/utils';
import { overdueLabel } from '@/lib/overdueLabel';
import { RISK_TABLE } from '@/components/risk/riskSurfaces';
import Pagination from '@/components/shared/Pagination';
import PersonCell from '@/components/board/meeting-actions/PersonCell';
import RowBulkBar from './RowBulkBar';
import RowTable from './RowTable';
import RatingBadge from '@/components/risk/RatingBadge';
import TreatmentBadge from '@/components/risk/TreatmentBadge';
import ProgressBar from '@/components/risk/ProgressBar';
import ActionRegisterToolbar from './ActionRegisterToolbar';
import RegisterLoading from './RegisterLoading';
import CapsuleTabs from '@/components/board/CapsuleTabs';
import { PRIORITY_STYLES, STATUS_STYLES, STATUS_OPTIONS } from '@/components/risk/steps/treatmentConstants';
import { isActionOverdue } from '@/lib/actionRegisterHelpers';
import { formatReviewDate } from '@/lib/riskRegisterHelpers';
import { sortRows } from '@/lib/registerSort';

const COLUMNS = [
{ id: 'description', label: 'Risk Treatments', width: 518 },
{ id: 'due_date', label: 'Due Date', width: 104 },
{ id: 'risk_treatment_strategy', label: 'Treatment Strategy', width: 170 },
{ id: 'status', label: 'Status', width: 100 },
{ id: 'progress', label: 'Treatment Progress %', width: 186 }];

// Actions with no/unknown status fall under "Not Started".
const normActionStatus = (a) => (STATUS_OPTIONS.includes(a.status) ? a.status : 'Not Started');

// Status options for the floating action bar, with dot colours matching the badges.
const STATUS_DOTS = {
  'Not Started': 'bg-slate-400',
  'In Progress': 'bg-blue-500',
  'On Hold': 'bg-amber-500',
  Completed: 'bg-emerald-500',
};
const BULK_STATUS_OPTIONS = STATUS_OPTIONS.map((s) => ({ value: s, dot: STATUS_DOTS[s] }));

export default function ActionRegisterGrid({ actions, onView, onEdit, onDelete, onChangeStatus, isLoading = false }) {
  const [statusTab, setStatusTab] = useState('All');
  const [selectedKeys, setSelectedKeys] = useState([]);
  const [search, setSearch] = useState('');
  const [activeFilters, setActiveFilters] = useState({});
  const [groupBy, setGroupBy] = useState(null);
  const [sort, setSort] = useState(null);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(50);

  const applyFilter = (fieldId, value) => {
    setActiveFilters((prev) => {
      const next = { ...prev };
      if (!value) delete next[fieldId];else next[fieldId] = value;
      return next;
    });
  };

  const statusCounts = useMemo(() => {
    const counts = { All: actions.length };
    STATUS_OPTIONS.forEach((s) => { counts[s] = 0; });
    actions.forEach((a) => { counts[normActionStatus(a)] += 1; });
    return counts;
  }, [actions]);

  const filtered = useMemo(() => {
    return actions.filter((a) => {
      if (statusTab !== 'All' && normActionStatus(a) !== statusTab) return false;
      for (const [fieldId, val] of Object.entries(activeFilters)) {
        if (a[fieldId] !== val) return false;
      }
      if (search) {
        const q = search.toLowerCase();
        if (
        !a.title?.toLowerCase().includes(q) &&
        !a.description?.toLowerCase().includes(q) &&
        !a.risk_title?.toLowerCase().includes(q) &&
        !a.owner?.toLowerCase().includes(q))
        return false;
      }
      return true;
    });
  }, [actions, activeFilters, search, statusTab]);

  const sorted = useMemo(
    () => sortRows(filtered, sort, { rating: 'risk_residual_rating', dueDate: 'due_date' }),
    [filtered, sort]
  );

  useEffect(() => {setPage(1);setSelectedKeys([]);}, [search, activeFilters, groupBy, sort, pageSize, statusTab]);

  const selectedRows = useMemo(() => actions.filter((a) => selectedKeys.includes(a._key)), [actions, selectedKeys]);
  const toggleOne = (key) =>
    setSelectedKeys((prev) => prev.includes(key) ? [] : [key]);

  const totalPages = Math.max(1, Math.ceil(sorted.length / pageSize));
  const currentPage = Math.min(page, totalPages);
  const paged = useMemo(
    () => sorted.slice((currentPage - 1) * pageSize, currentPage * pageSize),
    [sorted, currentPage, pageSize]
  );

  const groups = useMemo(() => {
    if (!groupBy) return [{ key: '__all__', label: null, items: paged }];
    const map = new Map();
    paged.forEach((a) => {
      const label = a[groupBy] || 'No value';
      if (!map.has(label)) map.set(label, []);
      map.get(label).push(a);
    });
    return [...map.entries()].sort((x, y) => x[0].localeCompare(y[0])).map(([label, items]) => ({ key: label, label, items }));
  }, [paged, groupBy]);

  const renderCell = (a, colId) => {
    switch (colId) {
      case 'description':
        return (
          <div>
            <p className="text-sm font-medium text-foreground line-clamp-1">{a.title || '—'}</p>
            {a.risk_title &&
            <p className="text-xs mt-1 line-clamp-1 text-muted-foreground">
              <span className="text-muted-foreground/70 font-medium">Risk: </span>{a.risk_title}
            </p>
            }
            {(a.owner || a.priority) &&
            <div className="flex items-center gap-3 mt-1.5 whitespace-nowrap">
              {a.owner &&
              <span className="inline-flex items-center gap-1.5 text-xs text-muted-foreground">
                  <span className="text-foreground">Owner:</span>
                  <PersonCell name={a.owner} size="sm" />
                </span>
              }
              {a.priority &&
              <span className="inline-flex items-center gap-1.5 text-xs">
                  <span className="text-foreground">Priority:</span>
                  <span className={cn('inline-block px-2 py-0.5 rounded-full font-medium', PRIORITY_STYLES[a.priority] || 'bg-muted text-muted-foreground')}>{a.priority}</span>
                </span>
              }
            </div>
            }
          </div>);

      case 'risk_residual_rating':
        return a.risk_residual_rating ? <RatingBadge rating={a.risk_residual_rating} /> : <span className="text-muted-foreground/50">—</span>;
      case 'risk_treatment_strategy':
        return <TreatmentBadge value={a.risk_treatment_strategy} />;
      case 'due_date':{
          if (a.resolve_by === 'On Going') return <span className="text-sm text-muted-foreground">On Going</span>;
          if (!a.due_date) return <span className="text-muted-foreground/50">—</span>;
          const overdue = isActionOverdue(a);
          return (
            <div>
              <span className={cn('text-sm whitespace-nowrap', overdue ? 'text-destructive font-semibold' : 'text-foreground')}>{formatReviewDate(a.due_date)}</span>
              {overdue && <p className="text-xs text-destructive">{overdueLabel(a.due_date)}</p>}
            </div>);

        }
      case 'status':
        return a.status ?
        <span className={cn('inline-block text-xs px-2 py-0.5 rounded-full font-medium whitespace-nowrap', STATUS_STYLES[a.status] || 'bg-slate-100 text-slate-600')}>{a.status}</span> :
        <span className="text-muted-foreground/50">—</span>;
      case 'progress':
        return <ProgressBar value={a.progress || 0} />;
      default:
        return null;
    }
  };

  return (
    <div>
      {/* Toolbar: status tabs (left) + search + group/filter/export */}
      <div className="flex items-center gap-3 mb-4">
        <div className="flex-1">
          <CapsuleTabs animated
            size="sm"
            tabs={[
              { value: 'All', label: 'All', count: statusCounts.All },
              ...STATUS_OPTIONS.map((s) => ({ value: s, label: s, count: statusCounts[s] })),
            ]}
            value={statusTab}
            onChange={setStatusTab}
          />
        </div>
        <div className="flex items-center gap-2 shrink-0">
          <div className="relative w-64">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground/60" />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search actions..."
              className="w-full pl-9 pr-3 h-9 border border-input bg-transparent text-sm outline-none focus:ring-1 focus:ring-ring placeholder:text-muted-foreground/50 rounded-[10px]" />
            
          </div>
          <ActionRegisterToolbar
            actions={actions}
            activeFilters={activeFilters}
            onApplyFilter={applyFilter}
            onClearFilter={() => setActiveFilters({})}
            groupBy={groupBy}
            onApplyGroup={setGroupBy}
            onClearGroup={() => setGroupBy(null)}
            sort={sort}
            selectedRows={selectedRows}
            onChangeSort={setSort} />
          
        </div>
      </div>

      {/* Per-group bordered tables */}
      {isLoading ? (
        <RegisterLoading />
      ) : filtered.length === 0 ? (
        <div className={cn(RISK_TABLE, 'py-12 text-center text-muted-foreground text-sm')}>No treatment actions found</div>
      ) : (
        <div className="space-y-4">
          {groups.map((group) => (
            <div key={group.key}>
              {group.label !== null && (
                <div className="flex items-center gap-2 mb-2">
                  <h3 className="text-sm font-semibold text-foreground">{group.label}</h3>
                  <span className="text-xs text-muted-foreground bg-muted rounded-full px-2 py-0.5">{group.items.length}</span>
                </div>
              )}
              <RowTable
                items={group.items}
                columns={COLUMNS}
                selectedKeys={selectedKeys}
                onToggle={toggleOne}
                onRowClick={(a) => { setSelectedKeys([]); onView?.(a); }}
                renderCell={renderCell}
              />
            </div>
          ))}
        </div>
      )}

      <RowBulkBar
        count={selectedKeys.length}
        onView={() => onView?.(selectedRows[0])}
        onEdit={() => onEdit?.(selectedRows[0])}
        onDelete={() => onDelete?.(selectedRows)}
        statusOptions={BULK_STATUS_OPTIONS}
        onChangeStatus={(status) => { onChangeStatus?.(selectedRows, status); setSelectedKeys([]); }}
        onClear={() => setSelectedKeys([])}
      />

      {!isLoading && filtered.length > 0 &&
      <Pagination
        page={currentPage}
        totalPages={totalPages}
        total={filtered.length}
        pageSize={pageSize}
        onPageChange={setPage}
        onPageSizeChange={setPageSize} />

      }
    </div>);

}