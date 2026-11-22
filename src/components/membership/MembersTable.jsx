import React from 'react';
import { format } from 'date-fns';
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import TagPills from '@/components/shared/tags/TagPills';
import GroupedTableBlock from '@/components/shared/table/GroupedTableBlock';
import CircleCheck from '@/components/shared/CircleCheck';
import { badgeTone } from '@/lib/statusBadge';
import { resolveStructureName } from '@/lib/memberPlanNames';
import MemberStatusPill from '@/components/membership/MemberStatusPill';
import PersonInitialsAvatar from '@/components/shared/PersonInitialsAvatar';

// Payment states — 'Pending' is payment awaited, distinct from the membership
// STATUS_STYLES 'pending' approval state above.
const PAYMENT_STATUS_STYLES = {
  Paid: badgeTone('green'),
  Pending: badgeTone('amber'),
  Overdue: badgeTone('red'),
};

const fmtDate = (d) => {
  if (!d) return '–';
  try { return format(new Date(d), 'dd MMM yyyy'); } catch { return '–'; }
};

function PaymentStatusBadge({ status }) {
  if (!status) return <span className="text-sm text-muted-foreground">–</span>;
  return (
    <span className={`inline-flex items-center text-xs font-medium border rounded-full px-2.5 py-0.5 ${PAYMENT_STATUS_STYLES[status] || 'bg-muted text-muted-foreground border-border'}`}>
      {status}
    </span>
  );
}

/** Single-select register table: onToggle(id) selects that row (or clears it when it is already selected). */
export default function MembersTable({ members, groups, structures = [], selectedId = null, onToggle = () => {}, onView = () => {} }) {
  // Pass `members` for a flat table, or `groups` ([{ key, members }]) to render
  // every group inside this single table so all groups share the one header's
  // column widths.
  const sections = groups || [{ key: '__all__', label: null, members: members || [] }];
  const allMembers = sections.flatMap((s) => s.members);

  if (allMembers.length === 0) {
    return (
      <div className="px-4 py-16 text-center text-sm text-muted-foreground">
        No members yet. Click <span className="font-medium text-primary">Add Member</span> to create one.
      </div>
    );
  }

  const renderTable = (rows, grouped = false) => {
    return (
      <Table className="table-fixed">
        <TableHeader>
          <TableRow className="bg-secondary/40 hover:bg-secondary/40">
            <TableHead style={grouped ? { width: '5%' } : undefined} className={grouped ? undefined : 'w-12'} aria-label="Select" />
            <TableHead style={{ width: '19%' }}>Name</TableHead>
            <TableHead style={{ width: '16%' }}>Membership Plan</TableHead>
            <TableHead style={{ width: grouped ? '11%' : '12%' }}>Start Date</TableHead>
            <TableHead style={{ width: grouped ? '11%' : '12%' }}>Expiration Date</TableHead>
            <TableHead style={{ width: '14%' }} className="whitespace-nowrap">Membership Status</TableHead>
            <TableHead style={{ width: grouped ? '11%' : '12%' }} className="whitespace-nowrap">Payment Status</TableHead>
            <TableHead style={{ width: grouped ? '13%' : '15%' }}>Tags</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {rows.map((m) => { const selected = m.id === selectedId; return (
            <tr key={m.id} onClick={() => onView(m)} className={cn('group border-b border-border last:border-0 transition-colors cursor-pointer', selected ? 'bg-primary/10' : 'hover:bg-sidebar-accent/70')}>
              <TableCell onClick={(e) => e.stopPropagation()}>{!m.__isSample && <CircleCheck checked={selected} onChange={() => onToggle(m.id)} />}</TableCell>
              <TableCell><div className="flex items-center gap-3"><PersonInitialsAvatar name={`${m.first_name || ''} ${m.last_name || ''}`} /><span className="text-sm font-medium text-foreground group-hover:text-primary transition-colors break-words">{m.first_name} {m.last_name}</span>{m.__isSample && <span className="text-[10px] font-semibold uppercase tracking-wide text-primary bg-primary/10 rounded-full px-1.5 py-0.5">Sample</span>}</div></TableCell>
              <TableCell className="text-sm text-muted-foreground break-words">{resolveStructureName(m, structures)}</TableCell>
              <TableCell className="text-sm text-muted-foreground">{fmtDate(m.start_date)}</TableCell>
              <TableCell className="text-sm text-muted-foreground">{m.expiration_date ? fmtDate(m.expiration_date) : 'Never'}</TableCell>
              <TableCell><MemberStatusPill status={m.status} /></TableCell>
              <TableCell><PaymentStatusBadge status={m.payment_status} /></TableCell>
              <TableCell><TagPills ids={m.tags} /></TableCell>
            </tr>
          ); })}
        </TableBody>
      </Table>
    );
  };

  return groups ? (
    <div className="space-y-4">
      {sections.map((section) => <GroupedTableBlock key={section.key} label={section.label || section.key} count={section.members.length}>{renderTable(section.members, true)}</GroupedTableBlock>)}
    </div>
  ) : renderTable(allMembers);
}