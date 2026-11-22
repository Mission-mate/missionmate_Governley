import React, { useState, useMemo, useEffect } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { Search } from 'lucide-react';
import PersonCell from '@/components/board/meeting-actions/PersonCell';
import { cn } from '@/lib/utils';
import { overdueLabel } from '@/lib/overdueLabel';
import { RISK_TABLE } from '@/components/risk/riskSurfaces';
import Pagination from '@/components/shared/Pagination';
import RiskTable from './RiskTable';
import RiskBulkBar from './RiskBulkBar';
import ConfirmTypeDialog from '@/components/board/documents/ConfirmTypeDialog';
import { saveRisk, deleteRisk } from '@/lib/riskApi';
import RatingBadge from '@/components/risk/RatingBadge';
import TreatmentBadge from '@/components/risk/TreatmentBadge';
import RiskRegisterToolbar from './RiskRegisterToolbar';
import RegisterLoading from './RegisterLoading';
import CapsuleTabs from '@/components/board/CapsuleTabs';
import { OPTION_COLORS } from '@/lib/registerColors';
import { fieldOptions } from '@/lib/riskApi';
import { getStatusStyle, getAppetiteStyle } from '@/components/risk/detail/statusStyles';
import { isReviewOverdue, formatReviewDate } from '@/lib/riskRegisterHelpers';
import { sortRows } from '@/lib/registerSort';

// Category + Owner are folded into the Risk Title cell (compact view) so the
// table fits the full container width without horizontal scrolling.
const COLUMNS = [
{ id: 'title', label: 'Risk Title', width: 481 },
{ id: 'residual_rating', label: 'Risk Rating', tooltip: 'Residual Risk Rating', width: 112 },
{ id: 'risk_appetite', label: 'Risk Appetite', width: 128 },
{ id: 'treatment_action', label: 'Treatment', width: 142 },
{ id: 'last_reviewed_date', label: 'Last Review', width: 105 },
{ id: 'next_review_date', label: 'Next Review', width: 114 }];


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

// Normalise a risk's status to Open/Closed (legacy "Active" counts as Open).
const normStatus = (r) => (r.status === 'Closed' ? 'Closed' : 'Open');

export default function RiskRegisterGrid({ risks, fields = [], onView, onEdit, leftSlot = null, statusTab = 'Open', onStatusTabChange, isLoading = false }) {
  const qc = useQueryClient();
  // Custom fields are never shown as register columns — they live in the detail pane only.
  const allColumns = COLUMNS;
  const [selectedIds, setSelectedIds] = useState([]);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [search, setSearch] = useState('');
  const [activeFilters, setActiveFilters] = useState({});
  const [groupBy, setGroupBy] = useState(null);
  const [sort, setSort] = useState(null);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(50);

  const categoryOptions = fieldOptions(fields, 'category');

  const applyFilter = (fieldId, value) => {
    setActiveFilters((prev) => {
      const next = { ...prev };
      if (!value) delete next[fieldId];else next[fieldId] = value;
      return next;
    });
  };

  const fieldValue = (risk, id) => id === 'status' ? risk.status || 'Active' : risk[id];

  const statusCounts = useMemo(() => ({
    Open: risks.filter((r) => normStatus(r) === 'Open').length,
    Closed: risks.filter((r) => normStatus(r) === 'Closed').length,
  }), [risks]);

  const filtered = useMemo(() => {
    return risks.filter((r) => {
      if (statusTab !== 'All' && normStatus(r) !== statusTab) return false;
      for (const [fieldId, val] of Object.entries(activeFilters)) {
        if (fieldValue(r, fieldId) !== val) return false;
      }
      if (search) {
        const q = search.toLowerCase();
        if (
        !r.title?.toLowerCase().includes(q) &&
        !r.risk_id?.toLowerCase().includes(q) &&
        !r.description?.toLowerCase().includes(q) &&
        !r.owner?.toLowerCase().includes(q))
        return false;
      }
      return true;
    });
  }, [risks, activeFilters, search, statusTab]);

  const sorted = useMemo(
    () => sortRows(filtered, sort, { rating: 'residual_rating', nextReview: 'next_review_date' }),
    [filtered, sort]
  );

  useEffect(() => {setPage(1);setSelectedIds([]);}, [search, activeFilters, groupBy, sort, pageSize, statusTab]);

  const selectedRisks = useMemo(() => risks.filter((r) => selectedIds.includes(r.id)), [risks, selectedIds]);

  const toggleOne = (rid) =>
    setSelectedIds((prev) => prev.includes(rid) ? [] : [rid]);

  const refresh = () => qc.invalidateQueries({ queryKey: ['risks'] });

  const handleChangeStatus = async (status) => {
    await Promise.all(selectedRisks.map((r) => saveRisk(r.id, { fields: { status } })));
    setSelectedIds([]);
    refresh();
  };

  const handleBulkDelete = async () => {
    await Promise.all(selectedRisks.map((r) => deleteRisk(r.id)));
    setConfirmDelete(false);
    setSelectedIds([]);
    refresh();
  };

  const totalPages = Math.max(1, Math.ceil(sorted.length / pageSize));
  const currentPage = Math.min(page, totalPages);
  const paged = useMemo(
    () => sorted.slice((currentPage - 1) * pageSize, currentPage * pageSize),
    [sorted, currentPage, pageSize]
  );

  const groups = useMemo(() => {
    if (!groupBy) return [{ key: '__all__', label: null, items: paged }];
    const map = new Map();
    paged.forEach((r) => {
      const label = fieldValue(r, groupBy) || 'No value';
      if (!map.has(label)) map.set(label, []);
      map.get(label).push(r);
    });
    return [...map.entries()].sort((x, y) => x[0].localeCompare(y[0])).map(([label, items]) => ({ key: label, label, items }));
  }, [paged, groupBy]);

  const renderCell = (risk, col) => {
    switch (col.id) {
      case 'title':
        return (
          <div>
            <p className="text-sm font-medium text-foreground line-clamp-1">{risk.title}</p>
            <div className="flex items-center gap-3 mt-1.5 whitespace-nowrap">
              {risk.risk_id &&
              <span className="inline-flex items-center gap-1.5 text-xs">
                  <span className="text-foreground">Risk ID:</span>
                  <span className="font-medium text-foreground">{risk.risk_id}</span>
                </span>
              }
              {risk.category &&
              <span className="inline-flex items-center gap-1.5 text-xs">
                  <span className="text-foreground">Category:</span>
                  <CategoryBadge value={risk.category} options={categoryOptions} />
                </span>
              }
              {risk.owner &&
              <span className="inline-flex items-center gap-1.5 text-xs text-muted-foreground">
                  <span className="text-foreground">Owner:</span>
                  <PersonCell name={risk.owner} size="sm" />
                </span>
              }
            </div>
          </div>);

      case 'residual_rating':
        return risk.residual_rating ? <RatingBadge rating={risk.residual_rating} /> : <span className="text-muted-foreground/50">—</span>;
      case 'last_reviewed_date':
        return risk.last_reviewed_date ?
        <span className="text-sm whitespace-nowrap text-foreground">{formatReviewDate(risk.last_reviewed_date)}</span> :
        <span className="text-muted-foreground/50 text-sm">—</span>;
      case 'risk_appetite':
        return risk.risk_appetite ?
        <span className={cn('inline-block text-xs px-2 py-0.5 rounded-full font-medium whitespace-nowrap', getAppetiteStyle(risk.risk_appetite))}>{risk.risk_appetite}</span> :
        <span className="text-muted-foreground/50">—</span>;
      case 'treatment_action':
        return <TreatmentBadge value={risk.treatment_action} />;
      case 'next_review_date':{
          if (!risk.next_review_date) return <span className="text-muted-foreground/50 text-sm">—</span>;
          const overdue = isReviewOverdue(risk);
          return (
            <div className="whitespace-nowrap">
            <span className={cn('text-sm', overdue ? 'text-destructive font-semibold' : 'text-foreground')}>
              {formatReviewDate(risk.next_review_date)}
            </span>
            {overdue && <span className="block text-xs text-destructive">{overdueLabel(risk.next_review_date)}</span>}
          </div>);

        }
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
            tabs={[
              { value: 'Open', label: 'Open', count: statusCounts.Open },
              { value: 'Closed', label: 'Closed', count: statusCounts.Closed },
            ]}
            value={statusTab}
            onChange={onStatusTabChange}
          />
          {leftSlot}
        </div>
        <div className="flex items-center gap-2 shrink-0">
          <div className="relative w-64">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground/60" />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search risks..."
              className="w-full pl-9 pr-3 h-9 border border-input bg-transparent text-sm outline-none focus:ring-1 focus:ring-ring placeholder:text-muted-foreground/50 rounded-[10px]" />
            
          </div>
          <RiskRegisterToolbar
            risks={risks}
            activeFilters={activeFilters}
            onApplyFilter={applyFilter}
            onClearFilter={() => setActiveFilters({})}
            groupBy={groupBy}
            onApplyGroup={setGroupBy}
            onClearGroup={() => setGroupBy(null)}
            sort={sort}
            onChangeSort={setSort}
            selectedRows={selectedRisks}
            categoryOptions={categoryOptions} />
          
        </div>
      </div>

      {/* Per-group bordered tables */}
      {isLoading ? (
        <RegisterLoading />
      ) : filtered.length === 0 ? (
        <div className={cn(RISK_TABLE, 'py-12 text-center text-muted-foreground text-sm')}>No risks found</div>
      ) : (
        <RiskTable
          groups={groups}
          columns={allColumns}
          selectedIds={selectedIds}
          onToggle={toggleOne}
          onRowClick={(r) => { setSelectedIds([]); onView(r); }}
          renderCell={renderCell}
        />
      )}

      <RiskBulkBar
        count={selectedIds.length}
        onView={() => onView(selectedRisks[0])}
        onEdit={() => onEdit(selectedRisks[0])}
        onChangeStatus={handleChangeStatus}
        onDelete={() => setConfirmDelete(true)}
        onClear={() => setSelectedIds([])}
      />

      <ConfirmTypeDialog
        isOpen={confirmDelete}
        title={selectedIds.length > 1 ? 'Delete Risks' : 'Delete Risk'}
        message={`Permanently delete ${selectedIds.length} risk${selectedIds.length !== 1 ? 's' : ''}? This cannot be undone.`}
        keyword="DELETE"
        confirmLabel="Delete"
        onConfirm={handleBulkDelete}
        onClose={() => setConfirmDelete(false)}
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