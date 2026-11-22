import React, { useState, useMemo } from 'react';
import { useParams } from 'react-router-dom';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { AnimatePresence } from 'framer-motion';
import { Plus, Search } from 'lucide-react';
import { Button } from '@/components/ui/button';
import TopBarBack from '@/components/shared/TopBarBack';
import CapsuleTabs from '@/components/board/CapsuleTabs';
import Pagination from '@/components/shared/Pagination';
import ModuleLoader from '@/components/shared/states/ModuleLoader';
import LoadError from '@/components/shared/states/LoadError';
import ConfirmTypeDialog from '@/components/board/documents/ConfirmTypeDialog';
import ActionRegisterToolbar from '@/components/board/meeting-actions/ActionRegisterToolbar';
import ActionBulkBar from '@/components/board/meeting-actions/ActionBulkBar';
import DecisionRegisterIcon from '@/components/board/decisions/DecisionRegisterIcon';
import DecisionSummaryCards from '@/components/board/decisions/DecisionSummaryCards';
import DecisionTable from '@/components/board/decisions/DecisionTable';
import DecisionFormPane from '@/components/board/decisions/DecisionFormPane';
import { getOrNull, loadFailure } from '@/lib/readState';
import { getDecisionRegister, listDecisions, deleteDecision } from '@/lib/decisionRegisterApi';
import { listMeetingsByIds, withMeetingDetails } from '@/lib/meetingActionApi';
import { exportDecisionsToExcel, exportDecisionsToPdf } from '@/lib/decisionExport';
import { DECISION_FACETS, STATUS_OPTIONS, decisionStatus } from '@/lib/decisions';
import { settleAllDeletes } from '@/lib/cascadeDelete';
import { runDelete } from '@/lib/deleteWithFeedback';

const FACET_IDS = DECISION_FACETS.map((f) => f.id);
const SORT_FIELDS = [{ key: 'decision_date', label: 'Decision Date' }];
const EXPORT_DIALOG = {
  noun: 'decisions',
  allLabel: 'All Decisions',
  options: STATUS_OPTIONS.map((s) => ({ value: s.name, label: `${s.name} Decisions` })),
};

export default function DecisionRegisterPage() {
  const { id } = useParams();
  const qc = useQueryClient();

  const [search, setSearch] = useState('');
  const [activeFilters, setActiveFilters] = useState({}); // { facetId: value }
  const [groupBy, setGroupBy] = useState(null);
  const [sort, setSort] = useState(null); // { key: 'decision_date', direction: 'asc'|'desc' }
  const [tabStatus, setTabStatus] = useState('Current');
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(50);
  const [editDecision, setEditDecision] = useState(null);
  const [viewDecision, setViewDecision] = useState(null);
  const [addOpen, setAddOpen] = useState(false);
  const [selectedIds, setSelectedIds] = useState([]);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [deleting, setDeleting] = useState(false);

  const { data: register, isLoading: regLoading, ...registerRead } = useQuery({
    queryKey: ['decisionRegister', id],
    queryFn: () => getOrNull(() => getDecisionRegister(id)),
  });

  const { data: storedDecisions = [], isLoading: decisionsLoading, ...decisionsRead } = useQuery({
    queryKey: ['decisions', id],
    queryFn: () => listDecisions(id),
    enabled: !!id,
  });

  // Meetings the decisions are linked to: title and date are always read from the Meeting record.
  const meetingIds = useMemo(
    () => [...new Set(storedDecisions.map((d) => d.meeting_id).filter(Boolean))].sort(),
    [storedDecisions]
  );
  const { data: linkedMeetings = [], ...meetingsRead } = useQuery({
    queryKey: ['actionMeetings', meetingIds],
    queryFn: () => listMeetingsByIds(meetingIds),
    enabled: meetingIds.length > 0,
    placeholderData: (prev) => prev,
  });
  const decisions = useMemo(() => withMeetingDetails(storedDecisions, linkedMeetings), [storedDecisions, linkedMeetings]);

  const invalidate = () => qc.invalidateQueries({ queryKey: ['decisions', id] });

  const selectedDecisions = useMemo(() => decisions.filter((d) => selectedIds.includes(d.id)), [decisions, selectedIds]);
  const toggleOne = (decisionId) => setSelectedIds((prev) => (prev.includes(decisionId) ? [] : [decisionId]));

  const handleDelete = async () => {
    if (deleting) return;
    setDeleting(true);
    try {
      const ok = await runDelete(
        () => settleAllDeletes(selectedDecisions.map((d) => deleteDecision(d.id)), 'decisions'),
        { errorTitle: 'Could not delete all decisions' }
      );
      await invalidate();
      if (!ok) return;
      setConfirmDelete(false);
      setSelectedIds([]);
    } finally {
      setDeleting(false);
    }
  };

  const tabDecisions = useMemo(() => decisions.filter((d) => decisionStatus(d) === tabStatus), [decisions, tabStatus]);
  const tabs = STATUS_OPTIONS.map((s) => ({
    value: s.name, label: s.name, count: decisions.filter((d) => decisionStatus(d) === s.name).length,
  }));

  const applyFilter = (facetId, value) => setActiveFilters((prev) => {
    const next = { ...prev };
    if (value) next[facetId] = value; else delete next[facetId];
    return next;
  });

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    const rows = tabDecisions.filter((d) => {
      if (Object.entries(activeFilters).some(([facetId, value]) => d[facetId] !== value)) return false;
      if (!q) return true;
      return [d.title, d.minuted_text, d.meeting_name, d.agenda_item].some((v) => v?.toLowerCase().includes(q));
    });
    if (sort) {
      const dir = sort.direction === 'desc' ? -1 : 1;
      // Undated decisions always sit last.
      rows.sort((a, b) => {
        const da = a.decision_date || ''; const db = b.decision_date || '';
        if (!da || !db) return da ? -1 : db ? 1 : 0;
        return (da < db ? -1 : da > db ? 1 : 0) * dir;
      });
    }
    return rows;
  }, [tabDecisions, activeFilters, search, sort]);

  // Reset to the first page whenever the result set changes.
  React.useEffect(() => { setPage(1); setSelectedIds([]); }, [search, activeFilters, tabStatus, groupBy, pageSize, sort]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / pageSize));
  const currentPage = Math.min(page, totalPages);
  const paged = useMemo(
    () => filtered.slice((currentPage - 1) * pageSize, currentPage * pageSize),
    [filtered, currentPage, pageSize]
  );

  const groups = useMemo(() => {
    if (!groupBy) return null;
    const facet = DECISION_FACETS.find((f) => f.id === groupBy);
    const map = new Map();
    paged.forEach((d) => {
      const label = d[groupBy] || `No ${facet.label}`;
      if (!map.has(label)) map.set(label, []);
      map.get(label).push(d);
    });
    return [...map.entries()].sort((x, y) => x[0].localeCompare(y[0])).map(([label, items]) => ({ key: label, label, items }));
  }, [paged, groupBy]);

  const handleExport = (format, scope) => {
    const rows = scope === 'all' ? decisions : decisions.filter((d) => decisionStatus(d) === scope);
    if (format === 'pdf') exportDecisionsToPdf(rows, register.title);
    else exportDecisionsToExcel(rows, register.title, decisions);
  };

  if (regLoading) return <ModuleLoader fullPage />;
  const failure = loadFailure(registerRead, decisionsRead, meetingsRead);
  if (failure.isLoadingError) return <LoadError page failure={failure} title="Couldn’t load this register" />;
  if (!register) return <div className="p-8 text-center text-muted-foreground">Register not found.</div>;

  return (
    <div className="h-full overflow-auto bg-background">
      <div className="max-w-7xl mx-auto p-6">
        <TopBarBack to="/board/decisions">Back to Decisions Registers</TopBarBack>
        <div className="flex items-center justify-between gap-4 mb-6">
          <div className="flex items-center gap-3 min-w-0">
            <DecisionRegisterIcon size={40} className="shrink-0 rounded-[10px] ring-1 ring-black/5 dark:ring-white/10" />
            <div className="min-w-0">
              <h1 className="text-base font-semibold text-foreground leading-tight truncate">{register.title}</h1>
              <p className="text-xs text-muted-foreground truncate">
                {decisions.length} decision{decisions.length !== 1 ? 's' : ''}
              </p>
            </div>
          </div>
          <Button onClick={() => { setEditDecision(null); setViewDecision(null); setAddOpen(true); setSelectedIds([]); }}>
            <Plus className="w-4 h-4" /> Add Decision
          </Button>
        </div>

        {/* Summary cards reflect only the decisions in the selected tab */}
        {decisionsLoading ? <ModuleLoader /> : <DecisionSummaryCards decisions={tabDecisions} />}

        <div className={`flex items-center gap-3 mb-4${decisionsLoading ? ' hidden' : ''}`}>
          <div className="shrink-0">
            <CapsuleTabs animated showZeroCount value={tabStatus} onChange={setTabStatus} tabs={tabs} />
          </div>
          {/* The search box gives way first, so three tabs and the toolbar fit on narrower screens. */}
          <div className="flex flex-1 min-w-0 items-center justify-end gap-2">
            <div className="relative flex-1 min-w-[8rem] max-w-64">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground/60" />
              <input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search decisions..."
                className="w-full pl-9 pr-3 h-9 border border-input bg-transparent text-sm outline-none focus:ring-1 focus:ring-ring placeholder:text-muted-foreground/50 rounded-[10px]" />
            </div>
            <ActionRegisterToolbar
              fields={DECISION_FACETS}
              facetIds={FACET_IDS}
              actions={decisions}
              activeFilters={activeFilters}
              onApplyFilter={applyFilter}
              onClearFilter={() => setActiveFilters({})}
              groupBy={groupBy}
              onApplyGroup={setGroupBy}
              onClearGroup={() => setGroupBy(null)}
              sort={sort}
              onChangeSort={setSort}
              sortFields={SORT_FIELDS}
              onExport={handleExport}
              exportDialogProps={EXPORT_DIALOG} />
          </div>
        </div>

        {decisionsLoading ? null : filtered.length === 0 ? (
          <div className="border border-border rounded-xl py-12 text-center text-muted-foreground text-sm">No decisions found</div>
        ) : (
          <DecisionTable
            {...(groupBy ? { groups } : { items: paged })}
            selectedIds={selectedIds}
            onToggle={toggleOne}
            onRowClick={(d) => { setViewDecision(d); setEditDecision(null); setAddOpen(false); setSelectedIds([]); }}
          />
        )}

        {filtered.length > 0 && (
          <Pagination
            page={currentPage}
            totalPages={totalPages}
            total={filtered.length}
            pageSize={pageSize}
            onPageChange={setPage}
            onPageSizeChange={setPageSize} />
        )}
      </div>

      {/* Add or edit pane */}
      <AnimatePresence>
        {(addOpen || editDecision) && (
          <DecisionFormPane
            key="decision-form-pane"
            register={register}
            decision={editDecision}
            allDecisions={decisions}
            onClose={() => { setAddOpen(false); setEditDecision(null); }}
            onSaved={invalidate} />
        )}
      </AnimatePresence>

      {/* View pane (opens read-only, can switch to edit inline) */}
      <AnimatePresence>
        {viewDecision && (
          <DecisionFormPane
            key="decision-view-pane"
            register={register}
            decision={viewDecision}
            allDecisions={decisions}
            readOnly
            onClose={() => setViewDecision(null)}
            onSaved={invalidate} />
        )}
      </AnimatePresence>

      <ActionBulkBar
        count={selectedIds.length}
        onView={() => { setViewDecision(selectedDecisions[0]); setEditDecision(null); setAddOpen(false); }}
        onEdit={() => { setEditDecision(selectedDecisions[0]); setViewDecision(null); setAddOpen(false); }}
        onDelete={() => setConfirmDelete(true)}
        onClear={() => setSelectedIds([])} />

      <ConfirmTypeDialog
        isOpen={confirmDelete}
        title="Delete Decision"
        message="Permanently delete this decision with its checklist, notes and documents? This cannot be recovered."
        keyword="DELETE"
        confirmLabel="Delete"
        onConfirm={handleDelete}
        onClose={() => setConfirmDelete(false)} />
    </div>
  );
}