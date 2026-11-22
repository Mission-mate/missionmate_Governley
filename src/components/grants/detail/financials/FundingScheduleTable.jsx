import React, { useState } from 'react';
import { Plus } from 'lucide-react';
import FundingNotesTab from '@/components/grants/detail/financials/FundingNotesTab';
import { Button } from '@/components/ui/button';
import { fmtCurrency, sumBy } from '@/lib/financials';
import { cn } from '@/lib/utils';
import StatusPill from '@/components/grants/detail/financials/StatusPill';
import CircleCheck from '@/components/shared/CircleCheck';
import FinancialEntryPane from '@/components/grants/detail/financials/FinancialEntryPane';
import FundingSelectionBar from '@/components/grants/detail/financials/FundingSelectionBar';
import ConfirmTypeDialog from '@/components/board/documents/ConfirmTypeDialog';

const FIELDS = [
  { key: 'label', label: 'Period', type: 'text', placeholder: 'e.g., Year 1, Quarter 1, June 2030' },
  { key: 'amount', label: 'Funding', type: 'currency', half: true },
  { key: 'amount_secondary', label: 'Received', type: 'currency', half: true },
  { key: 'status', label: 'Status', type: 'status' },
  { key: 'notes', label: 'Payment Details', type: 'richtext', placeholder: 'e.g., Paid by bank transfer — receipt no. 1042' },
];

export default function FundingScheduleTable({ rows, onAdd, onUpdate, onDelete, saving = false }) {
  const [openRow, setOpenRow] = useState(null); // { row, edit }
  const [adding, setAdding] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [selectedId, setSelectedId] = useState(null);
  const selected = rows.find((r) => r.id === selectedId) || null;
  const totalFunding = sumBy(rows, (r) => r.amount);
  const totalReceived = sumBy(rows, (r) => r.amount_secondary);
  const totalRemaining = totalFunding - totalReceived;

  const open = (row, edit) => { setSelectedId(null); setOpenRow({ row, edit }); };

  return (
    <div className="border border-border rounded-2xl bg-white dark:bg-card overflow-hidden">
      <div className="flex items-start justify-between px-6 py-5">
        <div>
          <h3 className="text-lg font-bold text-foreground">Funding Schedule</h3>
          <p className="text-sm text-muted-foreground mt-0.5">Payment schedule by financial year, including received amounts, remaining balances and status.</p>
        </div>
        <Button size="sm" disabled={saving} className="h-9 px-4 gap-1.5 rounded-lg shrink-0 text-sm" onClick={() => setAdding(true)}>
          <Plus className="w-4 h-4" /> {saving ? 'Saving…' : 'Add Record'}
        </Button>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-sm table-fixed">
          <colgroup>
            <col className="w-14" />
            <col className="w-[16%]" />
            <col className="w-[20%]" />
            <col className="w-[20%]" />
            <col className="w-[18%]" />
            <col />
          </colgroup>
          <thead>
            <tr className="bg-secondary/40 border-y border-border text-xs font-semibold uppercase tracking-wide text-foreground/80">
              <th className="px-4 py-3" />
              <th className="text-left font-semibold align-middle px-4 py-3">Period</th>
              <th className="text-right font-semibold align-middle px-4 py-3">Funding</th>
              <th className="text-right font-semibold align-middle px-4 py-3">Received</th>
              <th className="text-right font-semibold align-middle px-4 py-3">Remaining</th>
              <th className="text-center font-semibold align-middle px-4 py-3">Status</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((row) => {
              const remaining = Number(row.amount || 0) - Number(row.amount_secondary || 0);
              const isSel = row.id === selectedId;
              return (
                <tr
                  key={row.id}
                  onClick={() => { if (!saving) open(row, false); }}
                  className={cn('border-b border-border last:border-0 cursor-pointer transition-colors', isSel ? 'bg-primary/5' : 'hover:bg-sidebar-accent/70')}
                >
                  <td className="px-4 py-3" onClick={(e) => e.stopPropagation()}>
                    <CircleCheck checked={isSel} onChange={() => setSelectedId(isSel ? null : row.id)} />
                  </td>
                  <td className="px-4 py-3 font-semibold text-foreground">{row.label || '—'}</td>
                  <td className="px-4 py-3 text-right font-medium text-foreground">{fmtCurrency(row.amount)}</td>
                  <td className="px-4 py-3 text-right font-medium text-foreground">{fmtCurrency(row.amount_secondary)}</td>
                  <td className="px-4 py-3 text-right text-muted-foreground">{fmtCurrency(remaining)}</td>
                  <td className="px-4 py-3 text-center"><StatusPill status={row.status} /></td>
                </tr>);
            })}
            {rows.length === 0 &&
            <tr><td colSpan={6} className="px-4 py-8 text-center text-muted-foreground">No funding rows yet. Click "Add Record".</td></tr>
            }
          </tbody>
          {rows.length > 0 &&
          <tfoot>
              <tr className="border-t border-border font-bold text-foreground">
                <td />
                <td className="px-4 py-4">TOTAL</td>
                <td className="px-4 py-4 text-right">{fmtCurrency(totalFunding)}</td>
                <td className="px-4 py-4 text-right">{fmtCurrency(totalReceived)}</td>
                <td className="px-4 py-4 text-right">{fmtCurrency(totalRemaining)}</td>
                <td />
              </tr>
            </tfoot>
          }
        </table>
      </div>

      <FundingSelectionBar
        show={!!selected && !openRow && !deleteTarget}
        disabled={saving}
        onView={() => open(selected, false)}
        onEdit={() => open(selected, true)}
        onDelete={() => setDeleteTarget(selected)}
        onClear={() => setSelectedId(null)}
      />

      <FinancialEntryPane
        isOpen={adding}
        entry={null}
        title="Add Funding Schedule"
        fields={FIELDS}
        onClose={() => setAdding(false)}
        onSave={(patch) => onAdd('funding', patch)}
      />
      <FinancialEntryPane
        isOpen={!!openRow}
        entry={openRow?.row || null}
        startEditing={!!openRow?.edit}
        title="Edit Funding Schedule"
        viewTitle="View Funding Schedule"
        fields={FIELDS}
        onClose={() => setOpenRow(null)}
        onSave={(patch) => onUpdate(openRow.row.id, patch)}
        NotesTab={FundingNotesTab}
      />
      <ConfirmTypeDialog
        isOpen={!!deleteTarget}
        title="Delete funding record"
        message={`This will permanently delete "${deleteTarget?.label || 'this record'}" and update the totals.`}
        keyword="DELETE"
        confirmLabel="Delete"
        onClose={() => setDeleteTarget(null)}
        onConfirm={async () => { await onDelete(deleteTarget.id); setSelectedId(null); setDeleteTarget(null); }}
      />
    </div>);
}