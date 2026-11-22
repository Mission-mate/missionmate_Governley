import React, { useState, useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import TopBarBack from '@/components/shared/TopBarBack';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Plus, SlidersHorizontal } from 'lucide-react';
import { AnimatePresence } from 'framer-motion';
import { Button } from '@/components/ui/button';
import CapsuleTabs from '@/components/board/CapsuleTabs';
import WorkItemFormPane from '@/components/board/workplan/WorkItemFormPane';
import WorkItemToolbar from '@/components/board/workplan/WorkItemToolbar';
import PeriodTabs from '@/components/board/workplan/PeriodTabs';
import WorkItemBulkBar from '@/components/board/workplan/WorkItemBulkBar';
import WorkPlanFieldConfigPane from '@/components/board/workplan/WorkPlanFieldConfigPane';
import WorkPlanTemplateLibraryModal from '@/components/board/workplan/WorkPlanTemplateLibraryModal';
import CircleCheck from '@/components/shared/CircleCheck';
import GroupedTableBlock from '@/components/shared/table/GroupedTableBlock';
import LoaderOne from '@/components/ui/loaders/LoaderOne';
import LoadError from '@/components/shared/states/LoadError';
import { getOrNull, loadFailure } from '@/lib/readState';
import ConfirmTypeDialog from '@/components/board/documents/ConfirmTypeDialog';
import {
  listWorkItems, deleteWorkItem, isDueOverdue, dueMonthLabel, dueQuarterLabel, formatDate,
  resolveFields, saveWorkPlanConfig, STATUS_STYLES, PRIORITY_STYLES,
} from '@/lib/workPlanApi';
import { startYearFromDate } from '@/lib/financialYear';
import { settleAll, settleAllDeletes } from '@/lib/cascadeDelete';
import { runDelete } from '@/lib/deleteWithFeedback';
import { toast } from '@/components/ui/use-toast';
import { OPTION_COLORS } from '@/lib/registerColors';
import OptionBadge from '@/components/board/registers/OptionBadge';
import PersonCell from '@/components/board/meeting-actions/PersonCell';
import WorkPlanSummaryCards from '@/components/board/workplan/WorkPlanSummaryCards';
import ErrorBoundary from '@/components/shared/states/ErrorBoundary';
import { cn } from '@/lib/utils';
import { overdueLabel } from '@/lib/overdueLabel';
import usePageLeaveGuard from '@/hooks/usePageLeaveGuard';

function StatusBadge({ status }) {
  const s = STATUS_STYLES[status] || STATUS_STYLES['Not Started'];
  return <OptionBadge label={status} bg={s.bg} text={s.text} />;
}

function PriorityBadge({ priority }) {
  if (!priority) return null;
  const s = PRIORITY_STYLES[priority] || { bg: 'bg-gray-100', text: 'text-gray-600' };
  return <OptionBadge label={priority} bg={s.bg} text={s.text} />;
}

function optionStyle(opt) {
  const def = OPTION_COLORS.find((c) => c.id === (typeof opt === 'object' ? opt.color : null));
  return def ? { bg: def.bg, text: def.text } : { bg: 'bg-gray-100', text: 'text-gray-600' };
}

function CustomFieldCell({ field, rawVal }) {
  if (!rawVal) return <span className="text-muted-foreground/50">—</span>;
  const options = field.config?.options || [];
  if (field.type === 'Single Select') {
    const opt = options.find((o) => (typeof o === 'object' ? o.name : o) === rawVal);
    const s = opt ? optionStyle(opt) : { bg: 'bg-gray-100', text: 'text-gray-600' };
    return <OptionBadge label={rawVal} bg={s.bg} text={s.text} />;
  }
  return <span>{rawVal}</span>;
}

const STATUS_TABS = ['All', 'Not Started', 'In Progress', 'Completed', 'On Hold', 'Cancelled'];

export default function WorkPlanDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const qc = useQueryClient();

  const [tabStatus, setTabStatus] = useState('All');
  const [activeFilters, setActiveFilters] = useState({});
  // Work items are always grouped — Month is the default grouping.
  const [period, setPeriod] = useState('quarter');

  const [customiseOpen, setCustomiseOpen] = useState(false);
  const [editItem, setEditItem] = useState(null);
  const [viewItem, setViewItem] = useState(null);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [addOpen, setAddOpen] = useState(false);
  const [selectedIds, setSelectedIds] = useState(new Set());
  const [bulkDeleteOpen, setBulkDeleteOpen] = useState(false);
  const [saveTemplateOpen, setSaveTemplateOpen] = useState(false);
  const [templateSaveList, setTemplateSaveList] = useState([]);
  const [bulkBusy, setBulkBusy] = useState(false);
  const leave = usePageLeaveGuard();

  const { data: workPlan, isLoading: planLoading, ...planRead } = useQuery({
    queryKey: ['workPlan', id],
    queryFn: () => getOrNull(() => base44.entities.WorkPlan.get(id)),
  });

  const { data: items = [], isLoading: itemsLoading, ...itemsRead } = useQuery({
    queryKey: ['workItems', id],
    queryFn: () => listWorkItems(id),
    enabled: !!id,
  });

  const invalidate = () => qc.invalidateQueries({ queryKey: ['workItems', id] });

  const handleDelete = async () => {
    if (!deleteTarget) return;
    const ok = await runDelete(() => deleteWorkItem(deleteTarget.id), {
      errorTitle: 'Could not delete work item',
    });
    invalidate();
    if (ok) setDeleteTarget(null);
  };

  const handleSaveConfig = async (nextFields) => {
    await saveWorkPlanConfig(workPlan, nextFields);
    qc.invalidateQueries({ queryKey: ['workPlan', id] });
  };

  const selectedList = useMemo(
    () => items.filter((o) => selectedIds.has(o.id)),
    [items, selectedIds]
  );

  const clearSelection = () => setSelectedIds(new Set());

  // Switching status tab changes which rows exist — drop the stale selection.
  React.useEffect(() => { setSelectedIds(new Set()); }, [tabStatus]);

  const toggleOne = (itemId) => {
    setSelectedIds((prev) => (prev.has(itemId) ? new Set() : new Set([itemId])));
  };

  const handleBulkChangeStatus = async (status) => {
    if (bulkBusy) return;
    setBulkBusy(true);
    try {
      await runBulkChangeStatus(status);
    } finally {
      setBulkBusy(false);
    }
  };

  const runBulkChangeStatus = async (status) => {
    const entries = [...selectedIds].map((itemId) => ({
      id: itemId,
      promise: base44.entities.WorkItem.update(itemId, { status })
    }));
    const total = entries.length;
    const { failed } = await settleAll(entries);

    if (failed.length === 0) {
      clearSelection();
      await invalidate();
      return;
    }

    // Raw SDK/database messages stay internal — diagnostics only.
    console.error('Bulk work item status update failures', failed);
    await invalidate();
    // Partial failure trims the selection to the failed rows; a full failure
    // naturally keeps every originally selected row selected.
    setSelectedIds(new Set(failed.map((f) => f.id)));
    toast({
      variant: 'destructive',
      title: failed.length === total ? 'Could not update work items' : 'Could not update all work items',
      description:
        failed.length === total
          ? 'None of the selected work items could be updated. Please try again.'
          : `${failed.length} of ${total} work items could not be updated. They remain selected so you can retry.`
    });
  };

  const handleBulkDelete = async () => {
    if (bulkBusy) return;
    setBulkBusy(true);
    try {
      const ok = await runDelete(
        () => settleAllDeletes([...selectedIds].map((itemId) => deleteWorkItem(itemId)), 'work items'),
        { errorTitle: 'Could not delete all work items' }
      );
      await invalidate();
      if (!ok) return;
      setBulkDeleteOpen(false);
      clearSelection();
    } finally {
      setBulkBusy(false);
    }
  };

  const handleSaveToTemplate = () => {
    setTemplateSaveList(selectedList);
    setSaveTemplateOpen(true);
  };

  const periodType = workPlan?.compliance_period_type || 'Financial Year';
  const periodStart = startYearFromDate(workPlan?.financial_year_start);
  const periodLabel = periodStart
    ? periodType === 'Calendar Year'
      ? `Calendar Year ${periodStart}`
      : `Financial Year ${periodStart} - ${periodStart + 1}`
    : periodType;
  const fields = resolveFields(workPlan?.config);
  const statusOf = (o) => o.status || 'Not Started';

  const tabItems = useMemo(
    () => items.filter((o) => tabStatus === 'All' || statusOf(o) === tabStatus),
    [items, tabStatus]
  );

  const tabCounts = useMemo(() => {
    const counts = { All: items.length };
    ['Not Started', 'In Progress', 'Completed', 'On Hold', 'Cancelled'].forEach((s) => {
      counts[s] = items.filter((o) => statusOf(o) === s).length;
    });
    return counts;
  }, [items]);

  const fieldValueOf = (o, fieldId) => {
    // Year-suffixed so these match the period values offered in the Filter menu.
    if (fieldId === 'quarter') return dueQuarterLabel(o.due_date, workPlan);
    if (fieldId === 'month') return dueMonthLabel(o.due_date);
    if (fieldId === 'status') return statusOf(o);
    if (['priority', 'category', 'frequency', 'owner', 'due_date'].includes(fieldId)) return o[fieldId] || '';
    return (o.custom_fields || {})[fieldId] || '';
  };

  // Apply toolbar filters + sort
  const filtered = useMemo(() => {
    const rows = tabItems.filter((o) => {
      for (const [fid, val] of Object.entries(activeFilters)) {
        if (val && fieldValueOf(o, fid) !== val) return false;
      }
      return true;
    });
    // Default order: earliest due date first (undated items last)
    rows.sort((a, b) => {
      if (!a.due_date && !b.due_date) return 0;
      if (!a.due_date) return 1;
      if (!b.due_date) return -1;
      return a.due_date.localeCompare(b.due_date);
    });
    return rows;
  }, [tabItems, activeFilters, workPlan]);

  const applyFilter = (fieldId, value) => {
    setActiveFilters((prev) => {
      const next = { ...prev };
      if (!value) delete next[fieldId];
      else next[fieldId] = value;
      return next;
    });
  };

  // All filtered rows are rendered, split into groups (no pagination).
  const groups = useMemo(() => {
    const labelFor = {
      month: (d) => dueMonthLabel(d),
      quarter: (d) => dueQuarterLabel(d, workPlan),
      year: (d) => d?.slice(0, 4) || '',
    }[period];
    // Rows are already date-sorted, so groups appear in chronological order.
    const map = new Map();
    const unassigned = [];
    filtered.forEach((o) => {
      const label = labelFor(o.due_date);
      if (!label) { unassigned.push(o); return; }
      if (!map.has(label)) map.set(label, []);
      map.get(label).push(o);
    });
    const result = [...map].map(([key, rows]) => ({ key, items: rows }));
    if (unassigned.length > 0) result.push({ key: 'No Due Date', items: unassigned });
    return result;
  }, [period, filtered, workPlan]);

  const overdueCount = items.filter((o) => isDueOverdue(o.due_date, o.status)).length;
  const completedCount = items.filter((o) => o.status === 'Completed').length;

  const freqField = fields.find((f) => f.id === 'frequency');

  const renderRow = (item) => {
    const overdue = isDueOverdue(item.due_date, item.status);
    const selected = selectedIds.has(item.id);
    return (
      <tr
        key={item.id}
        onClick={() => { setViewItem(item); setEditItem(null); setAddOpen(false); clearSelection(); }}
        className={cn(
          'transition-colors cursor-pointer',
          selected ? 'bg-blue-50/50' : 'hover:bg-sidebar-accent/70'
        )}
      >
        <td className="px-4 py-3" onClick={(e) => e.stopPropagation()}>
          <CircleCheck checked={selected} onChange={() => toggleOne(item.id)} />
        </td>
        <td className="px-4 py-3">
          <p className="text-sm font-medium text-foreground truncate" title={item.title}>{item.title}</p>
          {item.category && (
            <p className="text-xs text-muted-foreground mt-0.5">Category: {item.category}</p>
          )}
        </td>
        <td className="px-4 py-3 whitespace-nowrap"><PersonCell name={item.owner} /></td>
        <td className="px-4 py-3 whitespace-nowrap">
          {item.due_date ? (
            <div>
              <span className={cn('text-sm', overdue ? 'text-destructive font-semibold' : 'text-foreground')}>
                {formatDate(item.due_date)}
              </span>
              {overdue && <span className="block text-xs text-destructive">{overdueLabel(item.due_date)}</span>}
            </div>
          ) : (
            <span className="text-muted-foreground/50 text-sm">—</span>
          )}
        </td>
        <td className="px-4 py-3"><StatusBadge status={item.status || 'Not Started'} /></td>
        <td className="px-4 py-3"><PriorityBadge priority={item.priority} /></td>
        <td className="px-4 py-3">
          <CustomFieldCell field={freqField || { type: 'Text/Number' }} rawVal={item.frequency} />
        </td>
      </tr>
    );
  };

  const TableHead = () => {
    return (
      <thead>
        <tr className="bg-secondary/40 border-b border-border">
          <th className="px-4 py-2.5 w-12" />
          <th className="text-left px-4 py-2.5 text-xs font-semibold text-foreground/80 uppercase tracking-wide">Work Item</th>
          <th className="text-left px-4 py-2.5 text-xs font-semibold text-foreground/80 uppercase tracking-wide whitespace-nowrap">Owner</th>
          <th className="text-left px-4 py-2.5 text-xs font-semibold text-foreground/80 uppercase tracking-wide whitespace-nowrap">Date</th>
          <th className="text-left px-4 py-2.5 text-xs font-semibold text-foreground/80 uppercase tracking-wide whitespace-nowrap">Status</th>
          <th className="text-left px-4 py-2.5 text-xs font-semibold text-foreground/80 uppercase tracking-wide whitespace-nowrap">Priority</th>
          <th className="text-left px-4 py-2.5 text-xs font-semibold text-foreground/80 uppercase tracking-wide whitespace-nowrap">Frequency</th>
        </tr>
      </thead>
    );
  };

  if (planLoading) {
    return <div className="flex justify-center py-20"><LoaderOne size="lg" /></div>;
  }
  const failure = loadFailure(planRead, itemsRead);
  if (failure.isLoadingError) return <LoadError page failure={failure} title="Couldn’t load this work plan" />;
  if (!workPlan) return <div className="p-8 text-center text-muted-foreground">Work plan not found.</div>;

  return (
    <div className="h-full overflow-auto bg-background">
      <div className="max-w-7xl mx-auto p-6">
      {/* Header */}
      <div className="relative z-30 flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <TopBarBack onClick={() => leave.guard(() => navigate('/board/work-plans'))}>Back to Annual Work Plan</TopBarBack>
          <div>
            <h1 className="text-base font-semibold text-foreground leading-tight">{workPlan.title}</h1>
            <p className="text-xs text-muted-foreground">Work Plan Period - {periodLabel}</p>
            <p className="text-xs text-muted-foreground">
              {items.length} item{items.length !== 1 ? 's' : ''}
              <span> · {completedCount} completed</span>
              {overdueCount > 0 && <span className="text-destructive"> · {overdueCount} overdue</span>}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" onClick={() => setCustomiseOpen(true)}>
            <SlidersHorizontal className="w-4 h-4" /> Customise
          </Button>
          <Button onClick={() => { setEditItem(null); setAddOpen(true); clearSelection(); }}>
            <Plus className="w-4 h-4" /> Add Work Item
          </Button>
        </div>
      </div>

      {/* Main content */}
      <div>
        {itemsLoading ? (
          <div className="py-16 flex justify-center"><LoaderOne size="lg" /></div>
        ) : (
          <ErrorBoundary resetKey={workPlan.id}>
            <WorkPlanSummaryCards items={items} workPlan={workPlan} />
          </ErrorBoundary>
        )}

        {/* Toolbar row */}
        <div className={`flex items-center gap-3 mb-4${itemsLoading ? ' hidden' : ''}`}>
          <div className="shrink-0">
            <CapsuleTabs
              animated
              value={tabStatus}
              onChange={(s) => leave.guard(() => setTabStatus(s))}
              tabs={STATUS_TABS.map((s) => ({ value: s, label: s, count: tabCounts[s] }))}
            />
          </div>
          <div className="flex-1" />
          <PeriodTabs value={period} onChange={setPeriod} />
          <WorkItemToolbar
            fields={fields}
            workPlan={workPlan}
            items={items}
            activeFilters={activeFilters}
            onApplyFilter={applyFilter}
            onClearFilter={() => setActiveFilters({})}
            tableColumns={fields}
            workPlanTitle={workPlan.title}
            selectedItems={selectedList}
          />
        </div>

        {/* Grouped view — always grouped, Month by default */}
        {itemsLoading ? null : groups.length === 0 ? (
          <div className="border border-border rounded-xl py-12 text-center text-muted-foreground text-sm">No work items found</div>
        ) : (
          <ErrorBoundary resetKey={`${tabStatus}:${period}`}>
            <div className="space-y-4">
              {groups.map((g) => (
                <GroupedTableBlock key={g.key} label={g.key} count={g.items.length}>
                  <table className="w-full table-fixed">
                    <colgroup>{['5%', '39.28%', '12.96%', '10.71%', '11.05%', '10%', '11%'].map((width, index) => <col key={index} style={{ width }} />)}</colgroup>
                    <TableHead />
                    <tbody className="divide-y divide-border">{g.items.map(renderRow)}</tbody>
                  </table>
                </GroupedTableBlock>
              ))}
            </div>
          </ErrorBoundary>
        )}
      </div>
      </div>

      {/* Form pane (add or edit) */}
      <AnimatePresence>
        {(addOpen || editItem) && (
          <WorkItemFormPane
            key="work-item-form-pane"
            workPlan={workPlan}
            item={editItem}
            allItems={items}
            onClose={() => { setAddOpen(false); setEditItem(null); }}
            onSaved={invalidate}
          />
        )}
      </AnimatePresence>

      {/* View pane */}
      <AnimatePresence>
        {viewItem && (
          <WorkItemFormPane
            key="work-item-view-pane"
            workPlan={workPlan}
            item={viewItem}
            allItems={items}
            readOnly
            onClose={() => setViewItem(null)}
            onSaved={invalidate}
          />
        )}
      </AnimatePresence>

      {/* Customise fields pane */}
      <AnimatePresence>
        {customiseOpen && (
          <WorkPlanFieldConfigPane
            key="work-plan-field-config-pane"
            fields={fields}
            onClose={() => setCustomiseOpen(false)}
            onSave={handleSaveConfig}
          />
        )}
      </AnimatePresence>

      {/* Delete confirmation */}
      <ConfirmTypeDialog
        isOpen={!!deleteTarget}
        title="Delete Work Item"
        message={`Permanently delete "${deleteTarget?.title?.slice(0, 40) || 'this work item'}"? This cannot be recovered.`}
        keyword="DELETE"
        confirmLabel="Delete"
        onConfirm={handleDelete}
        onClose={() => setDeleteTarget(null)}
      />

      {/* Bulk delete confirmation */}
      <ConfirmTypeDialog
        isOpen={bulkDeleteOpen}
        title="Delete Work Items"
        message={`Permanently delete ${selectedIds.size} work item${selectedIds.size === 1 ? '' : 's'}? This cannot be recovered.`}
        keyword="DELETE"
        confirmLabel="Delete"
        onConfirm={handleBulkDelete}
        onClose={() => setBulkDeleteOpen(false)}
      />

      {/* Floating action bar */}
      <WorkItemBulkBar
        count={selectedIds.size}
        onView={() => { const o = selectedList[0]; if (o) { setViewItem(o); setEditItem(null); setAddOpen(false); } }}
        onEdit={() => { const o = selectedList[0]; if (o) { setEditItem(o); setViewItem(null); setAddOpen(false); } }}
        onChangeStatus={handleBulkChangeStatus}
        onSaveTemplate={handleSaveToTemplate}
        onDelete={() => setBulkDeleteOpen(true)}
        onClear={clearSelection}
      />

      {/* Save to Work Plan Library */}
      <WorkPlanTemplateLibraryModal
        isOpen={saveTemplateOpen}
        itemsToSave={templateSaveList}
        onClose={() => { setSaveTemplateOpen(false); setTemplateSaveList([]); }}
        onSaved={() => { clearSelection(); }}
      />
      {leave.dialog}
    </div>
  );
}