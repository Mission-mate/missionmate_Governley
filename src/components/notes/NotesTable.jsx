import React from 'react';
import { format, parseISO, isValid } from 'date-fns';
import { cn } from '@/lib/utils';
import CircleCheck from '@/components/shared/CircleCheck';
import PlainHeader from '@/components/shared/table/PlainHeader';
import NoteIcon from '@/components/notes/NoteIcon';
import PersonInitialsAvatar from '@/components/shared/PersonInitialsAvatar';

const fmt = (d) => { if (!d) return '—'; const p = parseISO(d); return isValid(p) ? format(p, 'dd MMM yyyy') : '—'; };

/** Compact single-select notes table: title, owner, date. */
export default function NotesTable({ notes, selectedId, onSelect, onOpen }) {
  return (
    <div className="bg-card border border-border rounded-xl overflow-x-auto">
      <table className="w-full table-fixed min-w-[560px]">
        <thead>
          <tr className="bg-secondary/40 border-b border-border">
            <th className="py-2.5 pl-4 pr-0 w-12" />
            <PlainHeader className="w-[52%] py-3">Note Title</PlainHeader>
            <PlainHeader className="w-[24%] py-3">Owner</PlainHeader>
            <PlainHeader className="w-[24%] py-3">Date</PlainHeader>
          </tr>
        </thead>
        <tbody>
          {notes.map((n) => {
            const selected = n.id === selectedId;
            return (
              <tr
                key={n.id}
                onClick={() => onOpen(n)}
                className={cn('border-b border-border/40 last:border-0 cursor-pointer transition-colors', selected ? 'bg-primary/10' : 'hover:bg-sidebar-accent/70')}
              >
                <td className="py-3 pl-4 pr-0" onClick={(e) => e.stopPropagation()}>
                  <CircleCheck checked={selected} onChange={() => onSelect(selected ? null : n.id)} />
                </td>
                <td className="py-3 px-3 min-w-0">
                  <div className="flex items-center gap-3 min-w-0">
                    <NoteIcon color={n.color} size={32} />
                    <p className="text-sm font-semibold text-foreground truncate min-w-0">{n.title}</p>
                  </div>
                </td>
                <td className="py-3 px-3 text-sm text-foreground/80">
                  {n.owner_name ? (
                    <div className="flex items-center gap-3 min-w-0">
                      <PersonInitialsAvatar name={n.owner_name} />
                      <span className="truncate">{n.owner_name}</span>
                    </div>
                  ) : '—'}
                </td>
                <td className="py-3 px-3 text-sm tabular-nums text-foreground/80">{fmt(n.page_date || n.created_date)}</td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}