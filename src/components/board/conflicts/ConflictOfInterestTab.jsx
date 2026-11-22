import React, { useState, useMemo, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { useSearchParams } from 'react-router-dom';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useConflictScope, listScopePeople } from '@/lib/conflictScope';
import { activeDeclarations } from '@/lib/declarantRegister';
import { Plus, Search, ShieldAlert } from 'lucide-react';
import { AnimatePresence } from 'framer-motion';
import { Button } from '@/components/ui/button';
import OptionBadge from '@/components/board/registers/OptionBadge';
import Pagination from '@/components/shared/Pagination';
import ConflictSummaryCards from './ConflictSummaryCards';
import ConflictToolbar from './ConflictToolbar';
import ConflictTable from './ConflictTable';
import ConflictBulkBar from './ConflictBulkBar';
import LogConflictPane from './LogConflictPane';
import ViewConflictPane from './ViewConflictPane';
import ConfirmTypeDialog from '@/components/board/documents/ConfirmTypeDialog';
import {
  listConflicts, deleteConflict, updateConflict, resolveFields, complianceSystemFields,
  formatDate, STATUS_STYLES, RISK_STYLES, isConflictOverdue } from
'@/lib/conflictOfInterest';
import { OPTION_COLORS } from '@/lib/registerColors';
import CapsuleTabs from '@/components/board/CapsuleTabs';
import ModuleLoader from '@/components/shared/states/ModuleLoader';
import LoadError from '@/components/shared/states/LoadError';
import { loadFailure } from '@/lib/readState';
import { settleAllDeletes } from '@/lib/cascadeDelete';
import { countConflictChildren, describeConflictChildren } from '@/lib/conflictChildCounts';
import { runDelete } from '@/lib/deleteWithFeedback';
import { overdueLabel } from '@/lib/overdueLabel';
import { initialsOf } from '@/lib/initials';

const TITLE = 'Conflict of Interest Register';
const TOP_LEVEL = ['member_name', 'date_of_disclosure', 'committee_notified', 'status', 'conflict_type', 'review_frequency', 'last_review_date', 'next_review_date', 'risk_exposure', 'approved_by'];

function optionStyle(opt) {
  const def = OPTION_COLORS.find((c) => c.id === (typeof opt === 'object' ? opt.color : null));
  return def ? { bg: def.bg, text: def.text } : { bg: 'bg-gray-100', text: 'text-gray-600' };
}



function ApprovedByCell({ name }) {
  if (!name) return <span className="text-muted-foreground/50">—</span>;
  return (
    <span className="inline-flex items-center gap-2">
      <span className="w-7 h-7 rounded-full bg-primary/10 text-primary text-[11px] font-semibold inline-flex items-center justify-center shrink-0">
        {initialsOf(name)}
      </span>
      <span className="text-foreground">{name}</span>
    </span>);

}

function CellValue({ field, conflict }) {
  const raw = TOP_LEVEL.includes(field.id) ? conflict[field.id] : conflict.custom_fields?.[field.id];
  const overdue = isConflictOverdue(conflict);

  if (field.id === 'status') {
    const label = raw || 'Open';
    return <OptionBadge label={label} {...STATUS_STYLES[label] || STATUS_STYLES.Open} />;
  }
  if (field.id === 'next_review_date') {
    if (!raw) return <span className="text-muted-foreground/50">—</span>;
    if (overdue) {
      return (
        <span className="inline-block">
          <span className="block text-red-600 font-medium">{formatDate(raw)}</span>
          <span className="block text-xs text-red-600 mt-0.5">{overdueLabel(raw)}</span>
        </span>);

      }
    return <span>{formatDate(raw)}</span>;
  }
  if (field.id === 'risk_exposure') {
    if (!raw) return <span className="text-muted-foreground/50">—</span>;
    return <OptionBadge label={raw} {...RISK_STYLES[raw] || { bg: 'bg-gray-100', text: 'text-gray-600' }} />;
  }
  if (field.id === 'approved_by') {
    return <ApprovedByCell name={raw} />;
  }
  if (!raw) return <span className="text-muted-foreground/50">—</span>;
  if (field.id === 'review_frequency' && raw === 'Every' && conflict.interval_value) {
    return <span>{`Every ${conflict.interval_value} ${conflict.interval_unit || 'Months'}`}</span>;
  }
  if (field.type === 'Date') return <span>{formatDate(raw)}</span>;
  if (field.type === 'Single Select') {
    const opt = (field.config?.options || []).find((o) => (typeof o === 'object' ? o.name : o) === raw);
    const s = opt ? optionStyle(opt) : { bg: 'bg-gray-100', text: 'text-gray-600' };
    return <OptionBadge label={raw} bg={s.bg} text={s.text} />;
  }
  return <span>{raw}</span>;
}

/**
 * Conflict register table. Compliance has two uses:
 * - main Declarations Register: `onOpenInProfile` set → read-only (view pane with Open, no edit/status/delete);
 * - a declarant's profile: scope `declarant` set → only that person's declarations, full editing.
 */
export default function ConflictOfInterestTab({ headerSlotRef, onOpenInProfile, showSummary = true }) {
  const readOnly = !!onOpenInProfile;
  const qc = useQueryClient();
  const [statusTab, setStatusTab] = useState('Open');
  const [search, setSearch] = useState('');
  const [activeFilters, setActiveFilters] = useState({});
  const [groupBy, setGroupBy] = useState(null);
  const [sort, setSort] = useState(null); // { field, direction } | null
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(50);
  const [logOpen, setLogOpen] = useState(false);
  const [viewTarget, setViewTarget] = useState(null);
  const [viewStartEdit, setViewStartEdit] = useState(false);
  const [selectedIds, setSelectedIds] = useState([]);
  const [confirmDelete, setConfirmDelete] = useState(false);

  const { registerId, title: scopeTitle, customColumns, declarant } = useConflictScope();
  const conflictsKey = ['conflictsOfInterest', registerId];
  const { data: registerConflicts = [], isLoading: conflictsLoading, ...conflictsRead } = useQuery({
    queryKey: conflictsKey,
    queryFn: () => listConflicts(registerId)
  });
  const { data: people = [], isLoading: peopleLoading, ...peopleRead } = useQuery({
    queryKey: ['coiPeople', registerId],
    queryFn: () => listScopePeople(registerId)
  });
  const isLoading = conflictsLoading || (readOnly && peopleLoading);
  const failure = loadFailure(conflictsRead, peopleRead);
  const declarantUserId = declarant?.user_id;
  // Profile view: that declarant's declarations. Main read-only register: Active declarants only.
  const conflicts = useMemo(() => {
    if (declarantUserId) return registerConflicts.filter((c) => c.member_user_id === declarantUserId);
    if (readOnly) return activeDeclarations(registerConflicts, people);
    return registerConflicts;
  }, [registerConflicts, declarantUserId, readOnly, people]);

  // Arriving from the main Declarations Register ("Open") — open that declaration's pane once loaded.
  const [params, setParams] = useSearchParams();
  const requested = declarant ? params.get('declaration') : null;
  useEffect(() => {
    if (!requested || isLoading) return;
    const target = conflicts.find((c) => c.id === requested);
    if (target) { setStatusTab(target.status || 'Open'); setViewStartEdit(false); setViewTarget(target); }
    setParams((p) => { p.delete('declaration'); return p; }, { replace: true });
  }, [requested, isLoading, conflicts, setParams]);
  // System fields are fixed; custom columns come from the register's own config (managed via Customise).
  const config = useMemo(() => ({ fields: [...complianceSystemFields(), ...(customColumns || []).map((c) => ({
    id: c.id, label: c.title, type: c.type, config: c.config || {}, system: false, isVisible: c.table_visible === true,
  }))] }), [customColumns]);

  // Fetched only while the confirm dialog is open, so the user is told exactly
  // what the cascade will remove alongside the conflicts themselves.
  const { data: childCounts, isLoading: countsLoading } = useQuery({
    queryKey: ['conflictChildCounts', selectedIds],
    queryFn: () => countConflictChildren(selectedIds),
    enabled: confirmDelete && selectedIds.length > 0
  });

  const invalidate = () => {
    qc.invalidateQueries({ queryKey: conflictsKey });
    qc.invalidateQueries({ queryKey: ['coiPeople', registerId] });
  };

  const fields = resolveFields(config);

  // Columns: Member first (built-in), then configured fields except description (shown in member cell area)
  const tableColumns = useMemo(() => {
    const cols = fields.filter((f) => {
      if (f.id === 'description') return false;
      if (f.id === 'date_of_disclosure') return false;
      // Approved By is hidden from the table view (still shown in the panes)
      if (f.id === 'approved_by') return false;
      // Compliance register shows Type instead of Review Frequency
      if (registerId && f.id === 'review_frequency') return false;
      if (!f.system && f.isVisible === false) return false;
      return true;
    });
    // Main compliance Declarations Register shows Status last; the profile keeps it first.
    if (registerId && !declarant) return [...cols.filter((f) => f.id !== 'status'), ...cols.filter((f) => f.id === 'status')];
    return cols;
  }, [fields, registerId, declarant]);

  const applyFilter = (fieldId, value) => {
    setActiveFilters((prev) => {
      const next = { ...prev };
      if (!value) delete next[fieldId];else next[fieldId] = value;
      return next;
    });
  };

  const statusCounts = useMemo(() => ({
    Open: conflicts.filter((c) => (c.status || 'Open') === 'Open').length,
    Closed: conflicts.filter((c) => c.status === 'Closed').length
  }), [conflicts]);

  const filtered = useMemo(() => {
    const rows = conflicts.filter((c) => {
      if ((c.status || 'Open') !== statusTab) return false;
      for (const [fieldId, val] of Object.entries(activeFilters)) {
        const actual = TOP_LEVEL.includes(fieldId) ? c[fieldId] : c.custom_fields?.[fieldId];
        if (actual !== val) return false;
      }
      if (search) {
        const q = search.toLowerCase();
        if (!c.description?.toLowerCase().includes(q) && !c.title?.toLowerCase().includes(q) && !c.conflict_id?.toLowerCase().includes(q) && !c.member_name?.toLowerCase().includes(q)) return false;
      }
      return true;
    });
    if (!sort) return rows;
    // Undated records always sit last, whichever direction is chosen.
    const dir = sort.direction === 'asc' ? 1 : -1;
    return [...rows].sort((a, b) => {
      const x = a[sort.field], y = b[sort.field];
      if (!x || !y) return x ? -1 : y ? 1 : 0;
      return x.localeCompare(y) * dir;
    });
  }, [conflicts, statusTab, activeFilters, search, sort]);

  useEffect(() => {setPage(1);setSelectedIds([]);}, [search, activeFilters, groupBy, sort, pageSize, statusTab]);

  const selectedConflicts = useMemo(
    () => conflicts.filter((c) => selectedIds.includes(c.id)),
    [conflicts, selectedIds]
  );

  const toggleOne = (cid) =>
    setSelectedIds((prev) => prev.includes(cid) ? [] : [cid]);

  const handleChangeStatus = async (status) => {
    await Promise.all(selectedConflicts.map((c) => updateConflict(c.id, { status })));
    setSelectedIds([]);
    invalidate();
  };

  const totalPages = Math.max(1, Math.ceil(filtered.length / pageSize));
  const currentPage = Math.min(page, totalPages);
  const paged = useMemo(() => filtered.slice((currentPage - 1) * pageSize, currentPage * pageSize), [filtered, currentPage, pageSize]);

  const groups = useMemo(() => {
    if (!groupBy) return [{ key: '__all__', label: null, items: paged }];
    const groupField = fields.find((f) => f.id === groupBy);
    const map = new Map();
    paged.forEach((c) => {
      const key = TOP_LEVEL.includes(groupBy) ? c[groupBy] : c.custom_fields?.[groupBy];
      const label = key || `No ${groupField?.label || 'value'}`;
      if (!map.has(label)) map.set(label, []);
      map.get(label).push(c);
    });
    return [...map.entries()].sort((x, y) => x[0].localeCompare(y[0])).map(([label, items]) => ({ key: label, label, items }));
  }, [paged, groupBy, fields]);

  const childSummary = describeConflictChildren(childCounts);
  const deleteMessage = [
    `Permanently delete ${selectedIds.length} conflict${selectedIds.length !== 1 ? 's' : ''}? This cannot be recovered.`,
    countsLoading ? 'Checking linked records…' : childSummary && `This will also delete ${childSummary}.`
  ].filter(Boolean).join(' ');

  const handleDelete = async () => {
    const ok = await runDelete(
      () => settleAllDeletes(selectedConflicts.map((c) => deleteConflict(c.id)), 'conflicts'),
      { errorTitle: 'Could not delete all conflicts' }
    );
    invalidate();
    if (!ok) return;
    setConfirmDelete(false);
    setSelectedIds([]);
  };

  // Explicit React contract: the host page hands us the node to portal the
  // header action into. Re-read it whenever the ref identity changes.
  const [headerSlot, setHeaderSlot] = useState(null);
  useEffect(() => {
    setHeaderSlot(headerSlotRef?.current || null);
  }, [headerSlotRef]);

  const headerActions = readOnly ? null :
  <div className="flex items-center justify-end gap-3">
      <Button onClick={() => setLogOpen(true)}>
        <Plus className="w-4 h-4" /> {registerId ? 'Add Declaration' : 'Log Conflict of Interest'}
      </Button>
    </div>;


  return (
    <div>
      {headerActions && (headerSlot ? createPortal(headerActions, headerSlot) :
      <div className="mb-5">{headerActions}</div>)
      }

      {isLoading ? <ModuleLoader /> : showSummary && <ConflictSummaryCards conflicts={conflicts} />}

      {/* Status tabs (left) + Search + toolbar (right) */}
      <div className={`flex items-center gap-3 mb-4 flex-wrap${isLoading ? ' hidden' : ''}`}>
        <CapsuleTabs animated
          value={statusTab}
          onChange={setStatusTab}
          tabs={[
          { value: 'Open', label: 'Open', count: statusCounts.Open },
          { value: 'Closed', label: 'Closed', count: statusCounts.Closed }]
          } />
        
        <div className="flex-1" />
        <div className="relative w-64">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground/60" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder={registerId ? 'Search declarations...' : 'Search conflicts...'}
            className="w-full pl-9 pr-3 h-9 border border-input bg-transparent text-sm outline-none focus:ring-1 focus:ring-ring placeholder:text-muted-foreground/50 rounded-[10px]" />
          
        </div>
        <ConflictToolbar
          fields={fields}
          conflicts={conflicts}
          activeFilters={activeFilters}
          onApplyFilter={applyFilter}
          onClearFilter={() => setActiveFilters({})}
          groupBy={groupBy}
          onApplyGroup={setGroupBy}
          onClearGroup={() => setGroupBy(null)}
          sort={sort}
          onApplySort={setSort}
          onClearSort={() => setSort(null)}
          allConflicts={conflicts}
          selectedConflicts={registerId ? selectedConflicts : null}
          tableColumns={tableColumns}
          title={scopeTitle || TITLE} />
        
      </div>

      {/* Table — one bordered wrap per group */}
      {isLoading ? null : failure.isLoadingError ? (
        <LoadError failure={failure} title="Couldn’t load declarations" />
      ) : filtered.length === 0 ? (
        <div className="border border-border rounded-xl py-16 text-center text-muted-foreground text-sm">
          <ShieldAlert className="w-9 h-9 mx-auto mb-3 text-muted-foreground/40" />
          {conflicts.length === 0 ? (registerId ? 'No declarations recorded yet.' : 'No conflicts logged yet.') : 'No declarations match.'}
        </div>
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
              <ConflictTable
                items={group.items}
                columns={tableColumns}
                selectedIds={selectedIds}
                onToggle={toggleOne}
                onRowClick={(c) => {setSelectedIds([]);setViewStartEdit(false);setViewTarget(c);}}
                renderCell={(col, c) => <CellValue field={col} conflict={c} />}
              />
            </div>
          ))}
        </div>
      )}

      {filtered.length > 0 &&
      <Pagination page={currentPage} totalPages={totalPages} total={filtered.length} pageSize={pageSize} onPageChange={setPage} onPageSizeChange={setPageSize} />
      }

      {/* Log new conflict pane */}
      <AnimatePresence>
        {logOpen &&
        <LogConflictPane
          key="log-conflict-pane"
          conflict={null}
          people={people}
          allConflicts={registerConflicts}
          config={config}
          onClose={() => setLogOpen(false)}
          onSaved={invalidate} />
        }
      </AnimatePresence>

      {/* Unified view / edit pane */}
      <AnimatePresence>
        {viewTarget &&
        <ViewConflictPane
          key="view-conflict-pane"
          conflict={conflicts.find((c) => c.id === viewTarget.id) || viewTarget}
          config={config}
          people={people}
          allConflicts={registerConflicts}
          startInEdit={viewStartEdit}
          onOpen={readOnly ? () => onOpenInProfile(viewTarget) : undefined}
          onClose={() => setViewTarget(null)}
          onSaved={invalidate} />
        }
      </AnimatePresence>


      {/* Floating action bar */}
      <ConflictBulkBar
        count={selectedIds.length}
        currentStatus={selectedConflicts[0]?.status || statusTab}
        onView={() => {setViewStartEdit(false);setViewTarget(selectedConflicts[0]);}}
        onEdit={readOnly ? undefined : () => {setViewStartEdit(true);setViewTarget(selectedConflicts[0]);}}
        onChangeStatus={readOnly ? undefined : handleChangeStatus}
        onDelete={readOnly ? undefined : () => setConfirmDelete(true)}
        onClear={() => setSelectedIds([])} />

      <ConfirmTypeDialog
        isOpen={confirmDelete}
        title={selectedIds.length > 1 ? 'Delete Conflicts' : 'Delete Conflict'}
        message={deleteMessage}
        keyword="DELETE"
        confirmLabel="Delete"
        onConfirm={handleDelete}
        onClose={() => setConfirmDelete(false)} />
      
    </div>);

}