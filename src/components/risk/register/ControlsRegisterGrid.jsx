import React, { useState, useMemo, useEffect } from 'react';
import { Search } from 'lucide-react';
import { cn } from '@/lib/utils';
import { RISK_TABLE } from '@/components/risk/riskSurfaces';
import Pagination from '@/components/shared/Pagination';
import PersonCell from '@/components/board/meeting-actions/PersonCell';
import RowBulkBar from './RowBulkBar';
import RowTable from './RowTable';
import ControlsRegisterToolbar from './ControlsRegisterToolbar';
import RegisterLoading from './RegisterLoading';
import CapsuleTabs from '@/components/board/CapsuleTabs';
import { OPTION_COLORS } from '@/lib/registerColors';
import { fieldOptions } from '@/lib/riskApi';
import { EFFECTIVENESS_STYLES } from '@/components/risk/detail/controlConstants';

// Category + Owner are folded into the Control Name cell (subheadings) to match
// the Risk Register / reference layout.
const COLUMNS = [
  { id: 'control', label: 'Risk Controls', width: 360 },
  { id: 'design_effectiveness', label: 'Design Effectiveness', width: 160 },
  { id: 'operating_effectiveness', label: 'Operating Effectiveness', width: 170 },
];

function CategoryBadge({ value, options }) {
  if (!value) return <span className="text-muted-foreground/50">—</span>;
  const opt = (options || []).find((o) => (typeof o === 'object' ? o.name : o) === value);
  const def = OPTION_COLORS.find((c) => c.id === opt?.color);
  return (
    <span className={cn(
      'inline-flex items-center h-5 text-[11px] px-2 rounded-full font-medium whitespace-nowrap',
      def?.bg || 'bg-muted', def?.text || 'text-foreground'
    )}>
      {value}
    </span>
  );
}

// Normalise a control row's parent-risk status to Open/Closed (legacy "Active" = Open).
const normStatus = (c) => (c.risk_status === 'Closed' ? 'Closed' : 'Open');

export default function ControlsRegisterGrid({ controls, fields = [], onView, onEdit, onDelete, isLoading = false, statusTab = 'Open', onStatusTabChange }) {
  const categoryOptions = fieldOptions(fields, 'category');
  const setStatusTab = onStatusTabChange;
  const [selectedKeys, setSelectedKeys] = useState([]);
  const [search, setSearch] = useState('');
  const [activeFilters, setActiveFilters] = useState({});
  const [groupBy, setGroupBy] = useState(null);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(50);

  const applyFilter = (fieldId, value) => {
    setActiveFilters((prev) => {
      const next = { ...prev };
      if (!value) delete next[fieldId]; else next[fieldId] = value;
      return next;
    });
  };

  const statusCounts = useMemo(() => ({
    Open: controls.filter((c) => normStatus(c) === 'Open').length,
    Closed: controls.filter((c) => normStatus(c) === 'Closed').length,
  }), [controls]);

  const filtered = useMemo(() => {
    return controls.filter((c) => {
      if (normStatus(c) !== statusTab) return false;
      for (const [fieldId, val] of Object.entries(activeFilters)) {
        if (c[fieldId] !== val) return false;
      }
      if (search) {
        const q = search.toLowerCase();
        if (
          !c.control?.toLowerCase().includes(q) &&
          !c.description?.toLowerCase().includes(q) &&
          !c.risk_title?.toLowerCase().includes(q) &&
          !c.owner?.toLowerCase().includes(q)
        ) return false;
      }
      return true;
    });
  }, [controls, activeFilters, search, statusTab]);

  const sorted = filtered;

  useEffect(() => { setPage(1); setSelectedKeys([]); }, [search, activeFilters, groupBy, pageSize, statusTab]);

  const selectedRows = useMemo(() => controls.filter((c) => selectedKeys.includes(c._key)), [controls, selectedKeys]);
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
    paged.forEach((c) => {
      const label = c[groupBy] || 'No value';
      if (!map.has(label)) map.set(label, []);
      map.get(label).push(c);
    });
    return [...map.entries()].sort((x, y) => x[0].localeCompare(y[0])).map(([label, items]) => ({ key: label, label, items }));
  }, [paged, groupBy]);

  const renderCell = (c, colId) => {
    switch (colId) {
      case 'control':
        return (
          <div>
            <p className="text-sm font-medium text-foreground line-clamp-1">{c.control || '—'}</p>
            {c.risk_title && (
              <p className="text-xs mt-1 line-clamp-1 text-muted-foreground">
                <span className="text-muted-foreground/70 font-medium">Risk: </span>{c.risk_title}
              </p>
            )}
            {(c.category || c.owner) && (
              <div className="flex items-center gap-3 mt-1.5 flex-wrap">
                {c.category && (
                  <span className="inline-flex items-center gap-1.5 text-xs">
                    <span className="text-foreground">Risk Category:</span>
                    <CategoryBadge value={c.category} options={categoryOptions} />
                  </span>
                )}
                {c.owner && (
                  <span className="inline-flex items-center gap-1.5 text-xs text-muted-foreground">
                    <span className="text-foreground">Risk Owner:</span>
                    <PersonCell name={c.owner} size="sm" />
                  </span>
                )}
              </div>
            )}
          </div>
        );
      case 'design_effectiveness':
        return c.design_effectiveness ? (
          <span className={cn('inline-block text-xs px-2 py-0.5 rounded-full font-medium whitespace-nowrap', EFFECTIVENESS_STYLES[c.design_effectiveness] || 'bg-slate-100 text-slate-600')}>
            {c.design_effectiveness}
          </span>
        ) : <span className="text-muted-foreground/50">—</span>;
      case 'operating_effectiveness':
        return c.operating_effectiveness ? (
          <span className={cn('inline-block text-xs px-2 py-0.5 rounded-full font-medium whitespace-nowrap', EFFECTIVENESS_STYLES[c.operating_effectiveness] || 'bg-slate-100 text-slate-600')}>
            {c.operating_effectiveness}
          </span>
        ) : <span className="text-muted-foreground/50">—</span>;
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
              { value: 'Open', label: 'Open', count: statusCounts.Open },
              { value: 'Closed', label: 'Closed', count: statusCounts.Closed },
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
              placeholder="Search controls..."
              className="w-full pl-9 pr-3 h-9 border border-input bg-transparent text-sm outline-none focus:ring-1 focus:ring-ring placeholder:text-muted-foreground/50 rounded-[10px]"
            />
          </div>
          <ControlsRegisterToolbar
            controls={controls}
            activeFilters={activeFilters}
            onApplyFilter={applyFilter}
            onClearFilter={() => setActiveFilters({})}
            groupBy={groupBy}
            onApplyGroup={setGroupBy}
            onClearGroup={() => setGroupBy(null)}
            selectedRows={selectedRows}
            categoryOptions={categoryOptions}
          />
        </div>
      </div>

      {/* Per-group bordered tables */}
      {isLoading ? (
        <RegisterLoading />
      ) : filtered.length === 0 ? (
        <div className={cn(RISK_TABLE, 'py-12 text-center text-muted-foreground text-sm')}>No controls found</div>
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
                onRowClick={(c) => { setSelectedKeys([]); onView?.(c); }}
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
        onClear={() => setSelectedKeys([])}
      />

      {!isLoading && filtered.length > 0 && (
        <Pagination
          page={currentPage}
          totalPages={totalPages}
          total={filtered.length}
          pageSize={pageSize}
          onPageChange={setPage}
          onPageSizeChange={setPageSize}
        />
      )}
    </div>
  );
}