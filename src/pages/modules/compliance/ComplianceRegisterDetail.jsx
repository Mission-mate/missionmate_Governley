import React, { useState, useMemo } from 'react';
import { guardAction } from '@/lib/saveGuard';
import { useParams, useNavigate } from 'react-router-dom';
import TopBarBack from '@/components/shared/TopBarBack';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Plus, SlidersHorizontal, List, LayoutGrid } from 'lucide-react';
import TaskViewToggle from '@/components/strategy/level5/tasks/TaskViewToggle';
import ObligationBoard from '@/components/compliance/calendar/ObligationBoard';

const VIEWS = [{ id: 'list', label: 'List', Icon: List }, { id: 'board', label: 'Board', Icon: LayoutGrid }];
import { Button } from '@/components/ui/button';
import CapsuleTabs from '@/components/board/CapsuleTabs';
import PeriodTabs from '@/components/board/workplan/PeriodTabs';
import ObligationFormPane from '@/components/compliance/ObligationFormPane';
import ObligationToolbar from '@/components/compliance/ObligationToolbar';
import ObligationBulkBar from '@/components/compliance/ObligationBulkBar';
import CircleCheck from '@/components/shared/CircleCheck';
import ComplianceGroupBlock from '@/components/compliance/ComplianceGroupBlock';
import { NEUTRAL_CHIP } from '@/components/compliance/complianceSurfaces';
import { glowBackground, GLOW_CARD, GLOW_LABEL, GLOW_VALUE } from '@/lib/glowCard';
import LoaderOne from '@/components/ui/loaders/LoaderOne';
import LoadError from '@/components/shared/states/LoadError';
import { getOrNull, loadFailure } from '@/lib/readState';
import ComplianceFieldConfigPane from '@/components/compliance/ComplianceFieldConfigPane';
import ConfirmTypeDialog from '@/components/board/documents/ConfirmTypeDialog';
import TemplateLibraryModal from '@/components/compliance/templates/TemplateLibraryModal';
import { quarterOf, monthNameOf } from '@/components/compliance/calendar/periodGrouping';
import { dueMonthLabel, dueQuarterLabel } from '@/lib/workPlanApi';
import {
  listObligations, deleteObligations, isOverdue, formatDate,
  resolveFields, saveComplianceRegisterConfig, STATUS_STYLES, PRIORITY_STYLES,
} from '@/lib/complianceApi';
import useCascadeDelete from '@/hooks/useCascadeDelete';
import { OPTION_COLORS } from '@/lib/registerColors';
import OptionBadge from '@/components/board/registers/OptionBadge';
import PersonCell from '@/components/board/meeting-actions/PersonCell';
import { cn } from '@/lib/utils';
import { overdueLabel } from '@/lib/overdueLabel';

function StatusBadge({ status }) {
  const s = STATUS_STYLES[status] || STATUS_STYLES['Not Started'];
  return <OptionBadge label={status} bg={s.bg} text={s.text} />;
}

function PriorityBadge({ priority }) {
  if (!priority) return null;
  const s = PRIORITY_STYLES[priority] || NEUTRAL_CHIP;
  return <OptionBadge label={priority} bg={s.bg} text={s.text} />;
}

function optionStyle(opt) {
  const def = OPTION_COLORS.find((c) => c.id === (typeof opt === 'object' ? opt.color : null));
  return def ? { bg: def.bg, text: def.text } : NEUTRAL_CHIP;
}

function CustomFieldCell({ field, rawVal }) {
  if (!rawVal) return <span className="text-muted-foreground/50">—</span>;
  const options = field.config?.options || [];
  if (field.type === 'Single Select') {
    const opt = options.find((o) => (typeof o === 'object' ? o.name : o) === rawVal);
    const s = opt ? optionStyle(opt) : NEUTRAL_CHIP;
    return <OptionBadge label={rawVal} bg={s.bg} text={s.text} />;
  }
  return <span>{rawVal}</span>;
}

function SummaryCards({ obligations }) {
  const counts = {
    'Not Started': obligations.filter((o) => !o.status || o.status === 'Not Started').length,
    'In Progress': obligations.filter((o) => o.status === 'In Progress').length,
    Overdue: obligations.filter((o) => isOverdue(o.due_date, o.status)).length,
    Completed: obligations.filter((o) => o.status === 'Completed').length,
  };
  const cards = [
    { label: 'Not Started', count: counts['Not Started'], tint: 'oklch(0.94 0.045 250)', numGrad: 'linear-gradient(135deg, oklch(0.5 0.14 250), oklch(0.7 0.09 235))' },
    { label: 'In Progress', count: counts['In Progress'], tint: 'oklch(0.94 0.055 55)', numGrad: 'linear-gradient(135deg, oklch(0.58 0.15 55), oklch(0.76 0.12 70))' },
    { label: 'Overdue', count: counts['Overdue'], tint: 'oklch(0.93 0.055 25)', numGrad: 'linear-gradient(135deg, oklch(0.53 0.18 25), oklch(0.7 0.13 40))' },
    { label: 'Completed', count: counts['Completed'], tint: 'oklch(0.93 0.05 145)', numGrad: 'linear-gradient(135deg, oklch(0.5 0.14 145), oklch(0.68 0.1 160))' },
  ];

  return (
    <div className="flex mb-6" style={{ gap: '16px' }}>
      {cards.map((c) => (
        <div
          key={c.label}
          className={cn('flex flex-col', GLOW_CARD)}
          style={{ background: glowBackground(c.tint), flex: 1, minWidth: '160px', gap: '10px', borderRadius: '16px', padding: '22px 24px' }}
        >
          <div className={GLOW_VALUE} style={{ fontSize: '32px', fontWeight: 800, lineHeight: 1, background: c.numGrad, WebkitBackgroundClip: 'text', backgroundClip: 'text', color: 'transparent' }}>
            {c.count}
          </div>
          <div className={GLOW_LABEL} style={{ fontSize: '13px', fontWeight: 500, color: 'oklch(0.5 0.01 90)' }}>{c.label}</div>
        </div>
      ))}
    </div>
  );
}

export default function ComplianceRegisterDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const qc = useQueryClient();

  const STATUS_TABS = ['All', 'Not Started', 'In Progress', 'Completed', 'On Hold', 'Cancelled'];

  const [tabStatus, setTabStatus] = useState('All');
  const [activeFilters, setActiveFilters] = useState({});
  const [period, setPeriod] = useState('quarter');
  const [view, setView] = useState('list');
  const [sortDir, setSortDir] = useState(null);
  const [customiseOpen, setCustomiseOpen] = useState(false);
  const [editObligation, setEditObligation] = useState(null);
  const [viewObligation, setViewObligation] = useState(null);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [addOpen, setAddOpen] = useState(false);
  const [selectedIds, setSelectedIds] = useState(new Set());
  const [bulkDeleteOpen, setBulkDeleteOpen] = useState(false);
  const [templatesMode, setTemplatesMode] = useState(null); // 'browse' | 'save' | null
  const [templateSaveList, setTemplateSaveList] = useState([]);

  const { data: register, isLoading: regLoading, ...registerRead } = useQuery({
    queryKey: ['complianceRegister', id],
    queryFn: () => getOrNull(() => base44.entities.ComplianceRegister.get(id)),
  });

  const { data: obligations = [], isLoading: obLoading, ...obligationsRead } = useQuery({
    queryKey: ['complianceObligations', id],
    queryFn: () => listObligations(id),
    enabled: !!id,
  });

  const invalidate = () => qc.invalidateQueries({ queryKey: ['complianceObligations', id] });

  const del = useCascadeDelete(deleteObligations, 'obligation');

  const handleDelete = async () => {
    if (!deleteTarget) return;
    const failed = await del.confirm([deleteTarget.id]);
    if (!failed.length) setDeleteTarget(null);
    invalidate();
  };

  const handleSaveConfig = async (nextFields) => {
    await saveComplianceRegisterConfig(register, nextFields);
    qc.invalidateQueries({ queryKey: ['complianceRegister', id] });
  };

  const selectedList = useMemo(
    () => obligations.filter((o) => selectedIds.has(o.id)),
    [obligations, selectedIds]
  );

  const clearSelection = () => setSelectedIds(new Set());

  const toggleOne = (obId) => {
    setSelectedIds((prev) => (prev.has(obId) ? new Set() : new Set([obId])));
  };

  const handleBulkChangeStatus = guardAction(async (status) => {
    await Promise.all([...selectedIds].map((obId) => base44.entities.ComplianceObligation.update(obId, { status })));
    clearSelection();
    invalidate();
  }, 'Could not change the status');

  const handleBulkDelete = async () => {
    const failed = await del.confirm([...selectedIds]);
    setSelectedIds(new Set(failed));
    if (!failed.length) setBulkDeleteOpen(false);
    invalidate();
  };

  const handleSaveToTemplate = () => {
    setTemplateSaveList(selectedList);
    setTemplatesMode('save');
  };

  const fields = resolveFields(register?.config);
  const statusOf = (o) => o.status || 'Not Started';

  const tabObligations = useMemo(
    () => obligations.filter((o) => tabStatus === 'All' || statusOf(o) === tabStatus),
    [obligations, tabStatus]
  );

  const tabCounts = useMemo(() => {
    const counts = { All: obligations.length };
    ['Not Started', 'In Progress', 'Completed', 'On Hold', 'Cancelled'].forEach((s) => {
      counts[s] = obligations.filter((o) => statusOf(o) === s).length;
    });
    return counts;
  }, [obligations]);

  const periodType = register?.compliance_period_type || 'Financial Year';

  const fieldValueOf = (o, fieldId) => {
    if (fieldId === 'quarter') return quarterOf(o.due_date, periodType) || '';
    if (fieldId === 'month') return monthNameOf(o.due_date) || '';
    if (fieldId === 'status') return statusOf(o);
    if (['priority', 'category', 'regulator', 'frequency', 'owner'].includes(fieldId)) return o[fieldId] || '';
    return (o.custom_fields || {})[fieldId] || '';
  };

  // Apply toolbar filters + sort
  const filtered = useMemo(() => {
    const rows = tabObligations.filter((o) => {
      for (const [fid, val] of Object.entries(activeFilters)) {
        if (val && fieldValueOf(o, fid) !== val) return false;
      }
      return true;
    });
    // Default order: due date, oldest to newest (empty due dates last)
    const dir = sortDir === 'desc' ? -1 : 1;
    rows.sort((a, b) => {
      const da = a.due_date || ''; const db = b.due_date || '';
      if (!da && !db) return 0;
      if (!da) return 1;
      if (!db) return -1;
      return (da < db ? -1 : da > db ? 1 : 0) * dir;
    });
    return rows;
  }, [tabObligations, activeFilters, sortDir]);

  // Apply toolbar filter (partial — empty value clears that field)
  const applyFilter = (fieldId, value) => {
    setActiveFilters((prev) => {
      const next = { ...prev };
      if (!value) delete next[fieldId];
      else next[fieldId] = value;
      return next;
    });
  };

  // Always grouped by due-date period (Month / Quarter / Year) within the
  // calendar's reporting period. Rows are date-sorted, so groups follow that order.
  const groups = useMemo(() => {
    const labelFor = {
      month: (d) => dueMonthLabel(d),
      quarter: (d) => dueQuarterLabel(d, register),
      year: (d) => d?.slice(0, 4) || '',
    }[period];
    const start = register?.financial_year_start;
    const end = register?.financial_year_end;
    const map = new Map();
    const outside = [];
    const undated = [];
    filtered.forEach((o) => {
      if (!o.due_date) { undated.push(o); return; }
      if ((start && o.due_date < start) || (end && o.due_date > end)) { outside.push(o); return; }
      const label = labelFor(o.due_date);
      if (!map.has(label)) map.set(label, []);
      map.get(label).push(o);
    });
    const result = [...map].map(([key, items]) => ({ key, items }));
    if (outside.length > 0) result.push({ key: 'Outside Reporting Period', items: outside });
    if (undated.length > 0) result.push({ key: 'No Due Date', items: undated });
    return result;
  }, [period, filtered, register]);

  const overdueCount = obligations.filter((o) => isOverdue(o.due_date, o.status)).length;
  const completedCount = obligations.filter((o) => o.status === 'Completed').length;

  const freqField = fields.find((f) => f.id === 'frequency');

  const openView = (obligation) => { setViewObligation(obligation); setEditObligation(null); setAddOpen(false); };
  const openAdd = () => { setEditObligation(null); setViewObligation(null); setAddOpen(true); };

  const renderRow = (obligation) => {
    const overdue = isOverdue(obligation.due_date, obligation.status);
    const selected = selectedIds.has(obligation.id);
    return (
      <tr
        key={obligation.id}
        onClick={() => openView(obligation)}
        className={cn(
          'transition-colors cursor-pointer',
          selected ? 'bg-primary/10' : 'hover:bg-sidebar-accent/70'
        )}
      >
        <td className="px-4 py-3" onClick={(e) => e.stopPropagation()}>
          <CircleCheck checked={selected} onChange={() => toggleOne(obligation.id)} />
        </td>
        <td className="px-4 py-3">
          <p className="text-sm font-medium text-foreground truncate" title={obligation.title}>{obligation.title}</p>
          {(obligation.category || obligation.regulator) && (
            <div className="flex flex-wrap items-center gap-x-2 gap-y-0.5 mt-1 text-xs text-foreground">
              {obligation.category && (
                <span><span className="text-foreground">Category:</span> {obligation.category}</span>
              )}
              {obligation.category && obligation.regulator && <span className="text-foreground">·</span>}
              {obligation.regulator && (
                <span><span className="text-foreground">Regulator:</span> {obligation.regulator}</span>
              )}
            </div>
          )}
        </td>
        <td className="px-4 py-3 whitespace-nowrap"><PersonCell name={obligation.owner} /></td>
        <td className="px-4 py-3 whitespace-nowrap">
          {obligation.due_date ? (
            <div>
              <span className={cn('text-sm', overdue ? 'text-destructive font-semibold' : 'text-foreground')}>
                {formatDate(obligation.due_date)}
              </span>
              {overdue && <span className="block text-xs text-destructive">{overdueLabel(obligation.due_date)}</span>}
            </div>
          ) : (
            <span className="text-muted-foreground/50 text-sm">—</span>
          )}
        </td>
        <td className="px-4 py-3"><StatusBadge status={obligation.status || 'Not Started'} /></td>
        <td className="px-4 py-3"><PriorityBadge priority={obligation.priority} /></td>
        <td className="px-4 py-3">
          <CustomFieldCell field={freqField || { type: 'Text/Number' }} rawVal={obligation.frequency} />
        </td>
      </tr>
    );
  };

  const TableHead = () => {
    return (
      <thead>
        <tr className="bg-secondary/40 border-b border-border">
          <th className="px-4 py-2.5 w-12" />
          <th className="text-left px-4 py-2.5 text-xs font-semibold text-foreground/80 uppercase tracking-wide">Obligation</th>
          <th className="text-left px-4 py-2.5 text-xs font-semibold text-foreground/80 uppercase tracking-wide whitespace-nowrap">Owner</th>
          <th className="text-left px-4 py-2.5 text-xs font-semibold text-foreground/80 uppercase tracking-wide whitespace-nowrap">Due Date</th>
          <th className="text-left px-4 py-2.5 text-xs font-semibold text-foreground/80 uppercase tracking-wide whitespace-nowrap">Status</th>
          <th className="text-left px-4 py-2.5 text-xs font-semibold text-foreground/80 uppercase tracking-wide whitespace-nowrap">Priority</th>
          <th className="text-left px-4 py-2.5 text-xs font-semibold text-foreground/80 uppercase tracking-wide whitespace-nowrap">Frequency</th>
        </tr>
      </thead>
    );
  };

  if (regLoading || obLoading) {
    return <div className="flex justify-center py-20"><LoaderOne size="lg" /></div>;
  }
  const failure = loadFailure(registerRead, obligationsRead);
  if (failure.isLoadingError) return <LoadError page failure={failure} title="Couldn’t load this compliance calendar" />;
  if (!register) return <div className="p-8 text-center text-muted-foreground">Compliance calendar not found.</div>;

  return (
    <div className="h-full overflow-auto bg-background">
      <div className="max-w-7xl mx-auto p-6">
      {/* Header */}
      <div className="relative z-30 flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <TopBarBack onClick={() => navigate('/compliance/obligations')}>Back to Compliance Calendar</TopBarBack>
          <div>
            <h1 className="text-base font-semibold text-foreground leading-tight">{register.title}</h1>
            <p className="text-xs text-muted-foreground">
              {obligations.length} obligation{obligations.length !== 1 ? 's' : ''}
              <span> · {completedCount} completed</span>
              {overdueCount > 0 && <span className="text-destructive"> · {overdueCount} overdue</span>}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <TaskViewToggle value={view} onChange={setView} options={VIEWS} />
          <Button variant="outline" onClick={() => setCustomiseOpen(true)}>
            <SlidersHorizontal className="w-4 h-4" /> Customise
          </Button>
          <Button onClick={openAdd}>
            <Plus className="w-4 h-4" /> Add Obligation
          </Button>
        </div>
      </div>

      {/* Main content */}
      <div>
        <SummaryCards obligations={obligations} />

        {/* Toolbar row */}
        <div className="flex items-center gap-3 mb-4">
          <div className="shrink-0">
            <CapsuleTabs animated
              value={tabStatus}
              onChange={setTabStatus}
              size="sm"
              tabs={STATUS_TABS.map((s) => ({ value: s, label: s, count: tabCounts[s] }))}
            />
          </div>
          <div className="flex-1" />
          <PeriodTabs value={period} onChange={setPeriod} />
          <ObligationToolbar
            fields={fields}
            periodType={periodType}
            obligations={obligations}
            activeFilters={activeFilters}
            onApplyFilter={applyFilter}
            onClearFilter={() => setActiveFilters({})}
            sortDir={sortDir}
            onApplySort={setSortDir}
            onClearSort={() => setSortDir(null)}
            tableColumns={fields}
            registerTitle={register.title}
            selectedObligations={selectedList}
          />
        </div>

        {/* Grouped view — always grouped by period, Quarter by default */}
        {groups.length === 0 ? (
          <div className="border border-border rounded-xl py-12 text-center text-muted-foreground text-sm">No obligations found</div>
        ) : view === 'board' ? (
          <ObligationBoard groups={groups} selectedIds={selectedIds} onOpen={openView} onToggleSelect={toggleOne} onAdd={openAdd} />
        ) : (
          <div className="space-y-4">
            {groups.map((g) => (
              <ComplianceGroupBlock key={g.key} label={g.key} count={g.items.length}>
                <table className="w-full table-fixed">
                  <colgroup>{['5%', '40%', '14%', '11%', '11%', '9%', '10%'].map((width, index) => <col key={index} style={{ width }} />)}</colgroup>
                  <TableHead />
                  <tbody className="divide-y divide-border">{g.items.map(renderRow)}</tbody>
                </table>
              </ComplianceGroupBlock>
            ))}
          </div>
        )}
      </div>
      </div>

      {/* Form pane (add or edit) */}
      {(addOpen || editObligation) && (
        <ObligationFormPane
          register={register}
          obligation={editObligation}
          allObligations={obligations}
          onClose={() => { setAddOpen(false); setEditObligation(null); }}
          onSaved={invalidate}
        />
      )}

      {/* View pane */}
      {viewObligation && (
        <ObligationFormPane
          register={register}
          obligation={viewObligation}
          allObligations={obligations}
          readOnly
          onClose={() => setViewObligation(null)}
          onSaved={invalidate}
        />
      )}

      {/* Customise fields pane */}
      {customiseOpen && (
        <ComplianceFieldConfigPane
          fields={fields}
          onClose={() => setCustomiseOpen(false)}
          onSave={handleSaveConfig}
        />
      )}

      {/* Delete confirmation */}
      <ConfirmTypeDialog
        isOpen={!!deleteTarget}
        title="Delete Obligation"
        message={`Permanently delete "${deleteTarget?.title?.slice(0, 40) || 'this obligation'}"? Its checklist items, notes, documents and folders will be deleted too. This cannot be recovered.`}
        keyword="DELETE"
        confirmLabel="Delete"
        error={del.error}
        onConfirm={handleDelete}
        onClose={() => { setDeleteTarget(null); del.clearError(); }}
      />

      {/* Bulk delete confirmation */}
      <ConfirmTypeDialog
        isOpen={bulkDeleteOpen}
        title="Delete Obligations"
        message={`Permanently delete ${selectedIds.size} obligation${selectedIds.size === 1 ? '' : 's'}? Linked checklist items, notes, documents and folders will be deleted too. This cannot be recovered.`}
        keyword="DELETE"
        confirmLabel="Delete"
        error={del.error}
        onConfirm={handleBulkDelete}
        onClose={() => { setBulkDeleteOpen(false); del.clearError(); }}
      />

      {/* Floating action bar */}
      <ObligationBulkBar
        count={selectedIds.size}
        onView={() => { const o = selectedList[0]; if (o) openView(o); }}
        onEdit={() => { const o = selectedList[0]; if (o) { setEditObligation(o); setViewObligation(null); setAddOpen(false); } }}
        onChangeStatus={handleBulkChangeStatus}
        onSaveTemplate={handleSaveToTemplate}
        onDelete={() => setBulkDeleteOpen(true)}
        onClear={clearSelection}
      />

      {/* Template Library */}
      <TemplateLibraryModal
        isOpen={!!templatesMode}
        mode={templatesMode || 'browse'}
        register={register}
        registerObligations={obligations}
        obligationsToSave={templateSaveList}
        onClose={() => { setTemplatesMode(null); setTemplateSaveList([]); }}
        onApplied={invalidate}
        onSaved={() => { clearSelection(); }}
      />
    </div>
  );
}