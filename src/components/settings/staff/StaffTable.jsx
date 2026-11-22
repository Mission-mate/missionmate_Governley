import React from 'react';
import CircleCheck from '@/components/shared/CircleCheck';
import PersonInitialsAvatar from '@/components/shared/PersonInitialsAvatar';
import { cn } from '@/lib/utils';
import { ROLE_LABELS, ROLE_TEXT, memberName } from '@/lib/staffRoles';

const TH = 'text-left px-4 py-3 text-xs font-semibold text-foreground/80 uppercase tracking-wide align-middle';

export default function StaffTable({ members, selectedId, onSelect, onView }) {
  if (members.length === 0) {
    return (
      <div className="text-center py-16 text-muted-foreground text-sm">
        No team members found.
      </div>
    );
  }

  return (
    <table className="w-full text-sm">
      <thead>
        <tr className="bg-secondary/40 border-b border-border">
          <th className="w-12 px-4 py-3" />
          <th className={TH}>Name</th>
          <th className={TH}>Email</th>
          <th className={TH}>Role</th>
        </tr>
      </thead>
      <tbody>
        {members.map((m) => {
          const selected = selectedId === m.id;
          return (
            <tr
              key={m.id}
              onClick={() => onView(m)}
              className={cn(
                'group border-b border-border last:border-0 transition-colors cursor-pointer',
                selected ? 'bg-primary/10' : 'hover:bg-sidebar-accent/70'
              )}
            >
              <td className="px-4 py-3" onClick={(e) => e.stopPropagation()}>
                {/* Single selection — picking a row replaces the previous one. */}
                <CircleCheck checked={selected} onChange={() => onSelect(selected ? null : m.id)} />
              </td>
              <td className="px-4 py-3">
                <div className="flex items-center gap-3">
                  <PersonInitialsAvatar name={memberName(m)} />
                  <span className="font-semibold text-foreground">{memberName(m)}</span>
                </div>
              </td>
              <td className="px-4 py-3 text-foreground">{m.email}</td>
              <td className={cn('px-4 py-3 font-medium', ROLE_TEXT[m.role] || 'text-foreground')}>
                {ROLE_LABELS[m.role] || m.role}
              </td>
            </tr>
          );
        })}
      </tbody>
    </table>
  );
}