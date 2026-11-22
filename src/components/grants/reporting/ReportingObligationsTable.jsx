import React, { useState, useMemo } from 'react';
import { base44 } from '@/api/base44Client';
import { format, parseISO } from 'date-fns';
import { isObligationOverdue } from '@/lib/reportingOverdue';
import { cn } from '@/lib/utils';
import { overdueLabel } from '@/lib/overdueLabel';
import { useNavigate } from 'react-router-dom';
import AddReportingModal from './AddReportingModal';
import ReportingBulkBar from './ReportingBulkBar';
import CircleCheck from '@/components/shared/CircleCheck';
import { useToast } from '@/components/ui/use-toast';
import ModuleLoader from '@/components/shared/states/ModuleLoader';
import { badgeTone } from '@/lib/statusBadge';
import GroupedTableBlock from '@/components/shared/table/GroupedTableBlock';

const STATUS_STYLES = {
  not_started: `border ${badgeTone('slate')}`,
  in_progress: `border ${badgeTone('amber')}`,
  complete: `border ${badgeTone('green')}`
};

const STATUS_LABELS = {
  not_started: 'Not Started',
  in_progress: 'In Progress',
  complete: 'Completed'
};

// Only the three lifecycle statuses are stored — the fallback covers a missing status.
function displayStatus(status) {
  return status || 'not_started';
}

function fmtDate(d) {
  if (!d) return '–';
  try {return format(parseISO(d), 'dd MMM yyyy');} catch {return d;}
}

function initials(name) {
  if (!name) return '?';
  return name.split(' ').map((n) => n[0]).join('').toUpperCase().slice(0, 2);
}

/**
 * `obligations` is always the full row set. Pass `groups` ([{ key, items }]) to
 * render every group inside this ONE table with separator rows, so all groups
 * share the same column grid.
 */
export default function ReportingObligationsTable({
  obligations,
  groups,
  grants,
  isLoading,
  onRefresh,
  organizationId
}) {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [selected, setSelected] = useState([]);
  const [editObligation, setEditObligation] = useState(null);
  const [bulkProcessing, setBulkProcessing] = useState(false);

  // O(1) grant lookups — rebuilt only when the grants prop changes.
  const grantMap = useMemo(() => new Map((grants || []).map((g) => [g.id, g])), [grants]);

  const toggleOne = (id) => {
    setSelected((prev) => prev.includes(id) ? [] : [id]);
  };

  // Per-record updates: one failure must not discard the successes. allSettled
  // lets us refetch once, report exact counts, and keep only the failed rows
  // selected so they can be retried from the bulk bar.
  const handleStatusChange = async (newStatus) => {
    if (bulkProcessing) return;
    const ids = selected;
    setBulkProcessing(true);
    try {
      const results = await Promise.allSettled(
        ids.map((id) => base44.entities.ReportingObligation.update(id, { status: newStatus }))
      );
      const succeededIds = ids.filter((_, i) => results[i].status === 'fulfilled');
      const failedIds = ids.filter((_, i) => results[i].status === 'rejected');
      onRefresh();
      setSelected(failedIds);
      if (failedIds.length === 0) {
        toast({ title: `Updated ${succeededIds.length} obligation${succeededIds.length === 1 ? '' : 's'}` });
      } else if (succeededIds.length > 0) {
        toast({
          title: 'Partially completed',
          description: `Updated ${succeededIds.length} of ${ids.length}. ${failedIds.length} failed — still selected for retry.`,
          variant: 'destructive'
        });
      } else {
        toast({
          title: 'Error',
          description: `Failed to update ${failedIds.length} obligation${failedIds.length === 1 ? '' : 's'}.`,
          variant: 'destructive'
        });
      }
    } finally {
      setBulkProcessing(false);
    }
  };

  const handleRequirementClick = (ob) => {
    const grant = grantMap.get(ob.grant_id);
    if (grant) navigate(`/grants/${grant.id}?tab=reporting&obligation=${ob.id}`);
  };

  if (isLoading) {
    return <ModuleLoader />;
  }

  if (obligations.length === 0) {
    return <div className="py-16 text-center text-sm text-muted-foreground">No obligations in this category.</div>;
  }


  const renderRow = (ob) => {
    const grant = grantMap.get(ob.grant_id);
    const isOverdue = isObligationOverdue(ob);
    const isSelected = selected.includes(ob.id);
    return (
      <tr
        key={ob.id}
        onClick={() => handleRequirementClick(ob)}
        className={cn('border-b border-border last:border-0 cursor-pointer transition-colors', isSelected ? 'bg-primary/10' : 'hover:bg-sidebar-accent/70')}>
        <td className="px-4 py-4" onClick={(e) => e.stopPropagation()}>
          <CircleCheck checked={isSelected} onChange={() => toggleOne(ob.id)} />
        </td>
        <td className="px-4 py-4">
          <span className="font-semibold text-foreground">{ob.title}</span>
          {ob.reporting_type &&
          <p className="text-xs text-muted-foreground mt-0.5">{ob.reporting_type}</p>
          }
        </td>
        <td className="px-4 py-4">
          <p className="font-medium text-foreground leading-snug">{grant?.name || '–'}</p>
        </td>
        <td className="px-4 py-4">
          <p className="text-muted-foreground leading-snug text-sm">{grant?.provider || '–'}</p>
        </td>
        <td className="px-4 py-4">
          <p className={cn('font-medium', isOverdue ? 'text-destructive' : 'text-foreground')}>
            {fmtDate(ob.due_date)}
          </p>
          {isOverdue && <p className="text-xs text-destructive mt-0.5">{overdueLabel(ob.due_date)}</p>}
        </td>
        <td className="px-4 py-4">
          {ob.responsible_person ?
          <div className="flex items-center gap-2">
              <div className="w-7 h-7 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                <span className="text-primary text-xs font-bold">{initials(ob.responsible_person)}</span>
              </div>
              <span className="text-foreground text-sm">{ob.responsible_person}</span>
            </div> :
          <span className="text-muted-foreground">–</span>
          }
        </td>
        <td className="px-4 py-4">
          <span className={cn('px-2.5 py-1 rounded-full text-xs font-medium', STATUS_STYLES[displayStatus(ob.status)] || STATUS_STYLES.not_started)}>
            {STATUS_LABELS[displayStatus(ob.status)] || ob.status}
          </span>
        </td>
      </tr>);
  };

  return (
    <>
      {groups ? (
        <div className="space-y-4">
          {groups.map((g) => (
            <GroupedTableBlock key={g.key} label={g.key} count={g.items.length}>
              <table className="w-full table-fixed text-sm">
                <colgroup>{['4%', '22%', '17%', '15%', '13%', '17%', '12%'].map((width, index) => <col key={index} style={{ width }} />)}</colgroup>
                <thead><tr className="bg-secondary/40 border-b border-border">
                  <th className="px-4 py-3" />
                  <th className="text-left px-4 py-3 text-xs font-semibold text-foreground/80 uppercase tracking-wide">Obligation</th><th className="text-left px-4 py-3 text-xs font-semibold text-foreground/80 uppercase tracking-wide">Grant Title</th><th className="text-left px-4 py-3 text-xs font-semibold text-foreground/80 uppercase tracking-wide">Grant Provider</th><th className="text-left px-4 py-3 text-xs font-semibold text-foreground/80 uppercase tracking-wide">Due Date</th><th className="text-left px-4 py-3 text-xs font-semibold text-foreground/80 uppercase tracking-wide">Responsible Person</th><th className="text-left px-4 py-3 text-xs font-semibold text-foreground/80 uppercase tracking-wide">Status</th>
                </tr></thead>
                <tbody>{g.items.map(renderRow)}</tbody>
              </table>
            </GroupedTableBlock>
          ))}
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead><tr className="bg-secondary/40 border-b border-border">
              <th className="w-10 px-4 py-3" />
              <th className="text-left px-4 py-3 text-xs font-semibold text-foreground/80 uppercase tracking-wide">Obligation</th><th className="text-left px-4 py-3 text-xs font-semibold text-foreground/80 uppercase tracking-wide">Grant Title</th><th className="text-left px-4 py-3 text-xs font-semibold text-foreground/80 uppercase tracking-wide">Grant Provider</th><th className="text-left px-4 py-3 text-xs font-semibold text-foreground/80 uppercase tracking-wide">Due Date</th><th className="text-left px-4 py-3 text-xs font-semibold text-foreground/80 uppercase tracking-wide">Responsible Person</th><th className="text-left px-4 py-3 text-xs font-semibold text-foreground/80 uppercase tracking-wide">Status</th>
            </tr></thead>
            <tbody>{obligations.map(renderRow)}</tbody>
          </table>
        </div>
      )}

      {/* Floating capsule bulk bar */}
      {
      <ReportingBulkBar
        count={selected.length}
        processing={bulkProcessing}
        onOpen={() => {
          const ob = obligations.find((o) => o.id === selected[0]);
          if (ob) handleRequirementClick(ob);
        }}
        onStatusChange={handleStatusChange}
        onClear={() => setSelected([])} />

      }

      {/* Edit Modal */}
      <AddReportingModal
        isOpen={!!editObligation}
        onClose={() => setEditObligation(null)}
        grants={grants}
        organizationId={organizationId}
        obligation={editObligation}
        onSaved={() => {setEditObligation(null);setSelected([]);onRefresh();}} />
    </>);

}