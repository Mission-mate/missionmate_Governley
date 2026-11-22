import React from 'react';
import { Plus } from 'lucide-react';
import BoardCompletedGroup from '@/components/programs/planner/grid/BoardCompletedGroup';
import ObligationBoardCard from './ObligationBoardCard';

const isDone = (o) => o.status === 'Completed';

/** Board view: one column per period group (Month / Quarter / Year), completed obligations collapsed at the bottom. */
export default function ObligationBoard({ groups, selectedIds, onOpen, onToggleSelect, onAdd }) {
  const renderCard = (o) => (
    <ObligationBoardCard key={o.id} obligation={o} selected={selectedIds.has(o.id)}
      onOpen={() => onOpen(o)} onToggleSelect={() => onToggleSelect(o.id)} />
  );

  return (
    <div className="content-enter flex gap-4 overflow-x-auto pb-4 items-start">
      {groups.map((g) => {
        const open = g.items.filter((o) => !isDone(o));
        return (
          <div key={g.key} className="w-72 shrink-0 rounded-xl bg-muted p-3">
            <div className="flex items-center gap-2 px-1 py-1 mb-3 min-w-0">
              <span className="text-sm font-bold text-foreground truncate">{g.key}</span>
              <span className="min-w-5 h-5 px-1.5 rounded-full bg-card shadow-sm ring-1 ring-border text-xs text-muted-foreground flex items-center justify-center shrink-0">{open.length}</span>
            </div>
            {open.map(renderCard)}
            <button onClick={onAdd} className="flex items-center gap-1.5 px-1 py-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors">
              <Plus className="w-3.5 h-3.5" /> Add Obligation
            </button>
            <BoardCompletedGroup rows={g.items.filter(isDone)} renderCard={renderCard} />
          </div>
        );
      })}
    </div>
  );
}