import React, { useState } from 'react';
import { format, parseISO } from 'date-fns';
import { base44 } from '@/api/base44Client';
import { cn } from '@/lib/utils';
import { useNavigate } from 'react-router-dom';
import GrantBulkBar from './GrantBulkBar';
import ModalOverlay from '@/components/ui/ModalOverlay';
import { Button } from '@/components/ui/button';
import CircleCheck from '@/components/shared/CircleCheck';
import ModuleLoader from '@/components/shared/states/ModuleLoader';
import { useToast } from '@/components/ui/use-toast';
import { badgeTone } from '@/lib/statusBadge';
import GroupedTableBlock from '@/components/shared/table/GroupedTableBlock';

const STATUS_STYLES = {
  active: `border ${badgeTone('green')}`,
  closed: `border ${badgeTone('blue')}`,
  archived: `border ${badgeTone('amber')}`,
};

function fmtDate(d) {
  if (!d) return '–';
  try { return format(parseISO(d), 'dd MMM yyyy'); } catch { return d; }
}

function fmtAmount(n) {
  if (!n && n !== 0) return '–';
  return '$' + Number(n).toLocaleString();
}

function DeleteConfirmModal({ isOpen, onClose, onConfirm, count }) {
  const [typed, setTyped] = useState('');
  const [deleting, setDeleting] = useState(false);

  const handleConfirm = async () => {
    if (typed !== 'DELETE') return;
    setDeleting(true);
    // finally guarantees the button leaves its "Deleting..." state even if the
    // parent handler throws — otherwise the modal is permanently stuck.
    try {
      await onConfirm();
    } finally {
      setDeleting(false);
      setTyped('');
    }
  };

  return (
    <ModalOverlay isOpen={isOpen} onClose={() => { onClose(); setTyped(''); }} className="w-full max-w-sm">
      <div className="bg-card rounded-2xl shadow-2xl p-6">
        <h2 className="text-lg font-bold text-foreground mb-2">Delete {count > 1 ? `${count} Grants` : 'Grant'}</h2>
        <p className="text-sm text-muted-foreground mb-4">
          This action cannot be undone. Type <span className="font-bold text-foreground">DELETE</span> to confirm.
        </p>
        <input
          className="w-full rounded-md border border-input px-3 py-2 text-sm mb-4 focus:outline-none focus:ring-1 focus:ring-ring"
          placeholder="DELETE"
          value={typed}
          onChange={e => setTyped(e.target.value)}
        />
        <div className="flex items-center justify-end gap-3">
          <Button variant="outline" onClick={() => { onClose(); setTyped(''); }}>Cancel</Button>
          <Button variant="destructive" disabled={typed !== 'DELETE' || deleting} onClick={handleConfirm}>
            {deleting ? 'Deleting...' : 'Delete'}
          </Button>
        </div>
      </div>
    </ModalOverlay>
  );
}

/**
 * `grants` is always the full row set (used for select-all + bulk actions).
 * Pass `groups` ([{ key, items }]) to render every group inside this ONE table
 * with full-width separator rows, so all groups share the same column grid.
 */
export default function GrantTable({ grants, groups, isLoading, onRefresh }) {
  const [selected, setSelected] = useState([]);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [bulkProcessing, setBulkProcessing] = useState(false);
  const navigate = useNavigate();
  const { toast } = useToast();

  // Per-record bulk ops: one failure must not discard the successes. allSettled
  // lets us refetch once, report exact counts, and keep only the failed rows
  // selected so they can be retried from the bulk bar.
  const runBulk = async (ids, verb, op) => {
    setBulkProcessing(true);
    try {
      const results = await Promise.allSettled(ids.map(op));
      const succeededIds = ids.filter((_, i) => results[i].status === 'fulfilled');
      const failedIds = ids.filter((_, i) => results[i].status === 'rejected');
      onRefresh();
      setSelected(failedIds);
      if (failedIds.length === 0) {
        toast({ title: `${verb} ${succeededIds.length} grant${succeededIds.length === 1 ? '' : 's'}` });
      } else if (succeededIds.length > 0) {
        toast({
          title: 'Partially completed',
          description: `${verb} ${succeededIds.length} of ${ids.length}. ${failedIds.length} failed — still selected for retry.`,
          variant: 'destructive',
        });
      } else {
        toast({
          title: 'Error',
          description: `Failed to ${verb === 'Deleted' ? 'delete' : 'update'} ${failedIds.length} grant${failedIds.length === 1 ? '' : 's'}.`,
          variant: 'destructive',
        });
      }
    } finally {
      setBulkProcessing(false);
    }
  };

  const toggleOne = (id) => {
    setSelected(prev => prev.includes(id) ? [] : [id]);
  };

  const handleStatusChange = async (newStatus) => {
    if (bulkProcessing) return;
    // Obligation statuses are preserved — they're simply hidden from the
    // Reporting Obligations page while the grant isn't Active.
    await runBulk(selected, 'Updated', (id) => base44.entities.Grant.update(id, { status: newStatus }));
  };

  const handleDelete = async () => {
    if (bulkProcessing) return;
    try {
      await runBulk(selected, 'Deleted', (id) => base44.entities.Grant.delete(id));
    } finally {
      // Retry surface is the retained-selection bulk bar, so always close.
      setShowDeleteConfirm(false);
    }
  };

  if (isLoading) {
    return <ModuleLoader />;
  }

  if (grants.length === 0) {
    return <div className="py-16 text-center text-sm text-muted-foreground">No grants in this category.</div>;
  }


  const renderRow = (grant) => {
    const isSelected = selected.includes(grant.id);
    return (
      <tr
        key={grant.id}
        onClick={() => navigate(`/grants/${grant.id}`)}
        className={cn('border-b border-border last:border-0 cursor-pointer transition-colors', isSelected ? 'bg-primary/10' : 'hover:bg-sidebar-accent/70')}
      >
        <td className="py-4 px-4" onClick={(e) => e.stopPropagation()}>
          {!grant.__isSample && (
            <CircleCheck checked={isSelected} onChange={() => toggleOne(grant.id)} />
          )}
        </td>
        <td className="py-4 px-4">
          <div className="flex items-center gap-2">
            <span className="font-semibold text-foreground">{grant.name}</span>
            {grant.__isSample && (
              <span className="text-[10px] font-semibold uppercase tracking-wide text-primary bg-primary/10 rounded-full px-1.5 py-0.5">
                Sample
              </span>
            )}
          </div>
          {grant.reference_id && <p className="text-xs text-muted-foreground">{grant.reference_id}</p>}
        </td>
        <td className="py-4 px-4 font-medium text-foreground">{fmtAmount(grant.total_amount)}</td>
        <td className="py-4 px-4 text-muted-foreground text-sm">{grant.provider || '–'}</td>
        <td className="py-4 px-4 text-foreground">{grant.program || '–'}</td>
        <td className="py-4 px-4 text-muted-foreground">{fmtDate(grant.start_date)}</td>
        <td className="py-4 px-4 text-muted-foreground">{fmtDate(grant.end_date)}</td>
        <td className="py-4 px-4">
          <span className={cn('px-2.5 py-1 rounded-full text-xs font-medium capitalize', STATUS_STYLES[grant.status] || STATUS_STYLES.active)}>
            {grant.status}
          </span>
        </td>
      </tr>
    );
  };

  return (
    <>
      {groups ? (
        <div className="space-y-4">
          {groups.map((g) => (
            <GroupedTableBlock key={g.key} label={g.key} count={g.items.length}>
              <table className="w-full table-fixed text-sm">
                <colgroup>
                  {['4%', '18%', '14%', '16%', '16%', '11%', '11%', '10%'].map((width, index) => <col key={index} style={{ width }} />)}
                </colgroup>
                <thead>
                  <tr className="border-b border-border bg-secondary/40">
                    <th className="py-3 px-4" />
                    <th className="py-3 px-4 text-left text-xs font-semibold text-foreground/80 uppercase tracking-wide">Grant Title</th>
                    <th className="py-3 px-4 text-left text-xs font-semibold text-foreground/80 uppercase tracking-wide">Funding Amount</th>
                    <th className="py-3 px-4 text-left text-xs font-semibold text-foreground/80 uppercase tracking-wide">Grant Provider</th>
                    <th className="py-3 px-4 text-left text-xs font-semibold text-foreground/80 uppercase tracking-wide">Grant Activity</th>
                    <th className="py-3 px-4 text-left text-xs font-semibold text-foreground/80 uppercase tracking-wide">Start Date</th>
                    <th className="py-3 px-4 text-left text-xs font-semibold text-foreground/80 uppercase tracking-wide">End Date</th>
                    <th className="py-3 px-4 text-left text-xs font-semibold text-foreground/80 uppercase tracking-wide">Status</th>
                  </tr>
                </thead>
                <tbody>{g.items.map(renderRow)}</tbody>
              </table>
            </GroupedTableBlock>
          ))}
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border bg-secondary/40">
                <th className="py-3 px-4 w-10" />
                <th className="py-3 px-4 text-left text-xs font-semibold text-foreground/80 uppercase tracking-wide">Grant Title</th>
                <th className="py-3 px-4 text-left text-xs font-semibold text-foreground/80 uppercase tracking-wide">Funding Amount</th>
                <th className="py-3 px-4 text-left text-xs font-semibold text-foreground/80 uppercase tracking-wide">Grant Provider</th>
                <th className="py-3 px-4 text-left text-xs font-semibold text-foreground/80 uppercase tracking-wide">Grant Activity</th>
                <th className="py-3 px-4 text-left text-xs font-semibold text-foreground/80 uppercase tracking-wide">Start Date</th>
                <th className="py-3 px-4 text-left text-xs font-semibold text-foreground/80 uppercase tracking-wide">End Date</th>
                <th className="py-3 px-4 text-left text-xs font-semibold text-foreground/80 uppercase tracking-wide">Status</th>
              </tr>
            </thead>
            <tbody>{grants.map(renderRow)}</tbody>
          </table>
        </div>
      )}

      {(
        <GrantBulkBar
          count={selected.length}
          processing={bulkProcessing}
          onOpen={() => navigate(`/grants/${selected[0]}`)}
          onStatusChange={handleStatusChange}
          onArchive={() => handleStatusChange('archived')}
          showArchive={grants.some((g) => selected.includes(g.id) && g.status !== 'archived')}
          onDelete={() => setShowDeleteConfirm(true)}
          onClear={() => setSelected([])}
        />
      )}

      <DeleteConfirmModal
        isOpen={showDeleteConfirm}
        onClose={() => setShowDeleteConfirm(false)}
        onConfirm={handleDelete}
        count={selected.length}
      />
    </>
  );
}