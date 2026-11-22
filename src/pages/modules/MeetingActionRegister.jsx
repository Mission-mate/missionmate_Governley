import React, { useState, useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import TopBarBack from '@/components/shared/TopBarBack';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { AnimatePresence } from 'framer-motion';
import { base44 } from '@/api/base44Client';
import {
  Plus, Search } from
'lucide-react';
import { Button } from '@/components/ui/button';
import CapsuleTabs from '@/components/board/CapsuleTabs';
import Pagination from '@/components/shared/Pagination';
import ActionFormPane from '@/components/board/meeting-actions/ActionFormPane';
import ActionRegisterToolbar from '@/components/board/meeting-actions/ActionRegisterToolbar';
import ActionTable from '@/components/board/meeting-actions/ActionTable';
import ActionBulkBar from '@/components/board/meeting-actions/ActionBulkBar';
import ActionSummaryCards from '@/components/board/meeting-actions/ActionSummaryCards';
import ConfirmTypeDialog from '@/components/board/documents/ConfirmTypeDialog';
import ModuleLoader from '@/components/shared/states/ModuleLoader';
import LoadError from '@/components/shared/states/LoadError';
import { getOrNull, loadFailure } from '@/lib/readState';
import {
  listActions, updateAction, deleteAction, isOverdue,
  resolveFields, listMeetingsByIds, withMeetingDetails, MEETING_FIELD_IDS } from
'@/lib/meetingActionApi';
import { settleAll, settleAllDeletes } from '@/lib/cascadeDelete';
import { runDelete } from '@/lib/deleteWithFeedback';
import { toast } from '@/components/ui/use-toast';


export default function MeetingActionRegisterPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const qc = useQueryClient();

  const [search, setSearch] = useState('');
  const [activeFilters, setActiveFilters] = useState({}); // { fieldId: value }
  const [groupBy, setGroupBy] = useState(null);
  const [sort, setSort] = useState(null); // { key: 'due_date', direction: 'asc'|'desc' }
  const [tabStatus, setTabStatus] = useState('active'); // active | completed
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(50);
  const [editAction, setEditAction] = useState(null);
  const [viewAction, setViewAction] = useState(null);
  const [addOpen, setAddOpen] = useState(false);
  const [selectedIds, setSelectedIds] = useState([]);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [bulkBusy, setBulkBusy] = useState(false);

  const { data: register, isLoading: regLoading, ...registerRead } = useQuery({
    queryKey: ['meetingActionRegister', id],
    queryFn: () => getOrNull(() => base44.entities.MeetingActionRegister.get(id))
  });

  const { data: storedActions = [], isLoading: actionsLoading, ...actionsRead } = useQuery({
    queryKey: ['meetingActions', id],
    queryFn: () => listActions(id),
    enabled: !!id
  });

  // Meetings the actions are linked to — their title, committee and date are
  // always read from the Meeting record, so they never go stale.
  const meetingIds = useMemo(
    () => [...new Set(storedActions.map((a) => a.meeting_id).filter(Boolean))].sort(),
    [storedActions]
  );
  const { data: linkedMeetings = [], ...meetingsRead } = useQuery({
    queryKey: ['actionMeetings', meetingIds],
    queryFn: () => listMeetingsByIds(meetingIds),
    enabled: meetingIds.length > 0,
    placeholderData: (prev) => prev
  });
  const actions = useMemo(() => withMeetingDetails(storedActions, linkedMeetings), [storedActions, linkedMeetings]);

  const invalidate = () => qc.invalidateQueries({ queryKey: ['meetingActions', id] });

  const selectedActions = useMemo(
    () => actions.filter((a) => selectedIds.includes(a.id)),
    [actions, selectedIds]
  );

  const toggleOne = (actionId) =>
    setSelectedIds((prev) => prev.includes(actionId) ? [] : [actionId]);

  const handleMoveTo = async (registerStatus) => {
    if (bulkBusy) return;
    setBulkBusy(true);
    try {
      await runMoveTo(registerStatus);
    } finally {
      setBulkBusy(false);
    }
  };

  const runMoveTo = async (registerStatus) => {
    const entries = selectedActions.map((a) => ({
      id: a.id,
      promise: updateAction(a.id, { register_status: registerStatus })
    }));
    const total = entries.length;
    const { failed } = await settleAll(entries);

    if (failed.length === 0) {
      setSelectedIds([]);
      await invalidate();
      return;
    }

    // Raw SDK/database messages stay internal — diagnostics only.
    console.error('Bulk action update failures', failed);
    await invalidate();
    // Partial failure trims the selection to the failed rows; a full failure
    // naturally keeps every originally selected row selected.
    setSelectedIds(failed.map((f) => f.id));
    toast({
      variant: 'destructive',
      title: failed.length === total ? 'Could not update actions' : 'Could not update all actions',
      description:
        failed.length === total
          ? 'None of the selected actions could be updated. Please try again.'
          : `${failed.length} of ${total} actions could not be updated. They remain selected so you can retry.`
    });
  };

  const handleDelete = async () => {
    if (bulkBusy) return;
    setBulkBusy(true);
    try {
      const ok = await runDelete(
        () => settleAllDeletes(selectedActions.map((a) => deleteAction(a.id)), 'actions'),
        { errorTitle: 'Could not delete all actions' }
      );
      await invalidate();
      if (!ok) return;
      setConfirmDelete(false);
      setSelectedIds([]);
    } finally {
      setBulkBusy(false);
    }
  };

  const fields = resolveFields(register?.config);

  // Actions belonging to the selected capsule tab (default 'active' for legacy records with no value)
  const tabActions = useMemo(
    () => actions.filter((a) => (a.register_status || 'active') === tabStatus),
    [actions, tabStatus]
  );

  const tabCounts = useMemo(() => ({
    active: actions.filter((a) => (a.register_status || 'active') === 'active').length,
    completed: actions.filter((a) => a.register_status === 'completed').length
  }), [actions]);

  const applyFilter = (fieldId, value) => {
    setActiveFilters((prev) => {
      const next = { ...prev };
      if (!value) delete next[fieldId];else
      next[fieldId] = value;
      return next;
    });
  };

  // Read a field's raw value from an action (system fields are top-level, custom are nested)
  const fieldValue = (action, fieldId) => {
    if (fieldId === 'status') {
      return action.status || 'Not Started';
    }
    // System fields live on the record itself; custom fields are nested. Read the
    // record first so newly added system fields work without a hardcoded list.
    if (Object.prototype.hasOwnProperty.call(action, fieldId)) return action[fieldId];
    return action.custom_fields?.[fieldId];
  };

  // Columns to show in the table — exclude meeting-detail fields baked into the
  // "Action" cell, and respect the isVisible toggle for non-system fields.
  // Order follows the resolved config (system fields first, then custom).
  const tableColumns = useMemo(() => {
    return fields.filter((f) => {
      if (MEETING_FIELD_IDS.includes(f.id)) return false;
      if (!f.system && f.isVisible === false) return false;
      return true;
    });
  }, [fields]);

  const filtered = useMemo(() => {
    const rows = tabActions.filter((a) => {
      for (const [fieldId, val] of Object.entries(activeFilters)) {
        const actual = fieldValue(a, fieldId);
        if (fieldId === 'status') {
          if (actual !== val) return false;
        } else if (Array.isArray(actual) || typeof actual === 'string' && actual.startsWith('[')) {
          // multi-select value stored as JSON array
          let names = actual;
          if (typeof actual === 'string') {try {names = JSON.parse(actual);} catch {names = [actual];}}
          if (!Array.isArray(names) || !names.includes(val)) return false;
        } else if (actual !== val) return false;
      }
      if (search) {
        const q = search.toLowerCase();
        if (
        !a.title?.toLowerCase().includes(q) &&
        !a.action_id?.toLowerCase().includes(q) &&
        !a.assigned_to?.toLowerCase().includes(q))
        return false;
      }
      return true;
    });

    if (sort?.key === 'due_date') {
      const dir = sort.direction === 'desc' ? -1 : 1;
      rows.sort((a, b) => {
        const da = a.due_date || ''; const db = b.due_date || '';
        if (!da && !db) return 0;
        if (!da) return 1;
        if (!db) return -1;
        return (da < db ? -1 : da > db ? 1 : 0) * dir;
      });
    }
    return rows;
  }, [tabActions, activeFilters, search, sort]);

  // Reset to first page whenever the result set changes
  React.useEffect(() => {setPage(1);setSelectedIds([]);}, [search, activeFilters, tabStatus, groupBy, pageSize, sort]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / pageSize));
  const currentPage = Math.min(page, totalPages);
  const paged = useMemo(
    () => filtered.slice((currentPage - 1) * pageSize, currentPage * pageSize),
    [filtered, currentPage, pageSize]
  );

  // Group paged actions into sections when groupBy is set
  const groups = useMemo(() => {
    if (!groupBy) return null;
    const groupField = fields.find((f) => f.id === groupBy);
    const map = new Map();
    paged.forEach((a) => {
      let key = fieldValue(a, groupBy);
      if (Array.isArray(key)) key = key.join(', ');
      if (typeof key === 'string' && key.startsWith('[')) {try {key = JSON.parse(key).join(', ');} catch {/* keep */}}
      const label = key || `No ${groupField?.label || 'value'}`;
      if (!map.has(label)) map.set(label, []);
      map.get(label).push(a);
    });
    return [...map.entries()].sort((x, y) => x[0].localeCompare(y[0])).map(([label, items]) => ({ key: label, label, items }));
  }, [paged, groupBy, fields]);

  // Header overdue count stays register-wide
  const overdueCount = actions.filter((a) => isOverdue(a.due_date, a.status, a.register_status)).length;

  if (regLoading) {
    return <ModuleLoader fullPage />;
  }
  const failure = loadFailure(registerRead, actionsRead, meetingsRead);
  if (failure.isLoadingError) return <LoadError page failure={failure} title="Couldn’t load this register" />;
  if (!register) return <div className="p-8 text-center text-muted-foreground">Register not found.</div>;

  return (
    <div className="h-full overflow-auto bg-background">
      <div className="max-w-7xl mx-auto p-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <TopBarBack onClick={() => navigate('/board/meeting-actions')}>Back to Action Registers</TopBarBack>
          <div>
            <h1 className="text-base font-semibold text-foreground leading-tight">{register.title}</h1>
            <p className="text-xs text-muted-foreground">
              {actions.length} action{actions.length !== 1 ? 's' : ''}
              {overdueCount > 0 && <span className="text-destructive"> · {overdueCount} overdue</span>}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <Button onClick={() => {setEditAction(null);setAddOpen(true);setSelectedIds([]);}}>
            <Plus className="w-4 h-4" /> Add Action
          </Button>
        </div>
      </div>

      {/* Main content */}
      <div>
        {/* Summary cards reflect only the actions in the selected tab */}
        {actionsLoading ? <ModuleLoader /> : <ActionSummaryCards actions={tabActions} />}

        {/* Toolbar row: capsule tabs (left) · search + group/filter (right) */}
        <div className={`flex items-center gap-3 mb-4${actionsLoading ? ' hidden' : ''}`}>
          <div className="shrink-0">
            <CapsuleTabs
              animated
              value={tabStatus}
              onChange={setTabStatus}
              tabs={[
              { value: 'active', label: 'Open', count: tabCounts.active },
              { value: 'completed', label: 'Closed', count: tabCounts.completed }]
              } />
            
          </div>
          <div className="flex-1" />
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
              fields={fields}
              actions={actions}
              activeFilters={activeFilters}
              onApplyFilter={applyFilter}
              onClearFilter={() => setActiveFilters({})}
              groupBy={groupBy}
              onApplyGroup={setGroupBy}
              onClearGroup={() => setGroupBy(null)}
              sort={sort}
              onChangeSort={setSort}
              tableColumns={tableColumns}
              registerTitle={register.title} />
            
          </div>
        </div>

        {/* Table */}
        {actionsLoading ? null : filtered.length === 0 ? (
          <div className="border border-border rounded-xl py-12 text-center text-muted-foreground text-sm">No actions found</div>
        ) : (
          <ActionTable
            {...(groupBy ? { groups } : { items: paged })}
            columns={tableColumns}
            selectedIds={selectedIds}
            onToggle={toggleOne}
            onRowClick={(a) => { setViewAction(a); setEditAction(null); setAddOpen(false); setSelectedIds([]); }}
          />
        )}

        {/* Pagination */}
        {filtered.length > 0 &&
        <Pagination
          page={currentPage}
          totalPages={totalPages}
          total={filtered.length}
          pageSize={pageSize}
          onPageChange={setPage}
          onPageSizeChange={setPageSize} />
        }
      </div>
      </div>

      {/* Action form pane (add or edit) */}
      <AnimatePresence>
        {(addOpen || editAction) &&
        <ActionFormPane
          key="action-form-pane"
          register={register}
          action={editAction}
          allActions={actions}
          onClose={() => {setAddOpen(false);setEditAction(null);}}
          onSaved={invalidate} />
        }
      </AnimatePresence>

      {/* View pane (opens read-only, can switch to edit inline) */}
      <AnimatePresence>
        {viewAction &&
        <ActionFormPane
          key="action-view-pane"
          register={register}
          action={viewAction}
          allActions={actions}
          readOnly
          onClose={() => setViewAction(null)}
          onSaved={invalidate} />
        }
      </AnimatePresence>

      {/* Floating action bar */}
      <ActionBulkBar
        count={selectedIds.length}
        onView={() => { setViewAction(selectedActions[0]); setEditAction(null); setAddOpen(false); }}
        onEdit={() => { setEditAction(selectedActions[0]); setViewAction(null); setAddOpen(false); }}
        onMoveTo={handleMoveTo}
        onDelete={() => setConfirmDelete(true)}
        onClear={() => setSelectedIds([])} />

      {/* Permanent delete confirmation */}
      <ConfirmTypeDialog
        isOpen={confirmDelete}
        title={selectedIds.length > 1 ? 'Delete Actions' : 'Delete Action'}
        message={`Permanently delete ${selectedIds.length} action${selectedIds.length !== 1 ? 's' : ''}? This cannot be recovered.`}
        keyword="DELETE"
        confirmLabel="Delete"
        onConfirm={handleDelete}
        onClose={() => setConfirmDelete(false)} />
    </div>);

}