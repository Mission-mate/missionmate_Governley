import React from 'react';
import { format, parseISO, isPast, isToday } from 'date-fns';
import { ExternalLink } from 'lucide-react';

const STATUS_COLORS = {
  not_started: '#94a3b8',
  in_progress: '#f59e0b',
  complete: '#16a34a',
  archived: '#94a3b8',
};
const STATUS_LABELS = {
  not_started: 'Not Started',
  in_progress: 'In Progress',
  complete: 'Completed',
  archived: 'Archived',
};

const Pill = ({ text, color }) => (
  <span className="text-[11px] font-medium rounded-full px-2 py-0.5" style={{ color, backgroundColor: `${color}1A` }}>
    {text}
  </span>
);

const fmt = (v) => { try { return format(parseISO(v), 'd MMM yyyy'); } catch { return v; } };

function isOverdue(ob) {
  if (ob.status === 'complete' || ob.status === 'archived' || !ob.due_date) return false;
  const d = parseISO(ob.due_date);
  return isPast(d) && !isToday(d);
}

/** Read-only basic details card for one reporting obligation inside a summary pane. */
export default function ObligationSummaryCard({ obligation, grantName, onOpen }) {
  const status = obligation.status || 'not_started';
  const overdue = isOverdue(obligation);

  return (
    <div className="border border-border rounded-xl p-3 bg-card shadow-[0_1px_2px_rgba(15,23,42,0.06),0_4px_12px_rgba(15,23,42,0.08)] dark:shadow-[0_1px_2px_rgba(0,0,0,0.4),0_4px_14px_rgba(0,0,0,0.35)] transition-[transform,box-shadow] duration-200 ease-out hover:-translate-y-0.5 hover:shadow-[0_2px_4px_rgba(15,23,42,0.08),0_8px_20px_rgba(15,23,42,0.10)] dark:hover:shadow-[0_2px_4px_rgba(0,0,0,0.45),0_8px_22px_rgba(0,0,0,0.45)] motion-reduce:transition-none motion-reduce:hover:translate-y-0">
      <div className="flex items-start justify-between gap-2">
        <div className="flex items-center gap-2 min-w-0">
          <span className="text-[10px] uppercase tracking-wider font-semibold rounded-md px-1.5 py-0.5 bg-muted text-muted-foreground">
            Obligation
          </span>
          {obligation.type && <span className="text-[11px] text-muted-foreground truncate">{obligation.type}</span>}
          <span className="text-[11px] text-muted-foreground truncate">· {obligation.responsible_person || obligation.owner || 'Unassigned'}</span>
        </div>
        {onOpen && (
          <button onClick={() => onOpen(obligation)} className="text-muted-foreground hover:text-primary transition-colors">
            <ExternalLink className="w-4 h-4" />
          </button>
        )}
      </div>
      <div className="mt-1.5 text-xs font-normal text-foreground">{obligation.title || obligation.name || 'Untitled'}</div>
      <div className="mt-2 flex items-center gap-1.5 flex-wrap">
        <span className="text-[11px] text-muted-foreground">Status:</span>
        <Pill text={overdue ? 'Overdue' : (STATUS_LABELS[status] || status)} color={overdue ? '#dc2626' : (STATUS_COLORS[status] || '#94a3b8')} />
        {obligation.due_date && (
          <span className={`text-[11px] ${overdue ? 'text-red-600 font-medium' : 'text-muted-foreground'}`}>
            Due {fmt(obligation.due_date)}
          </span>
        )}
      </div>
      {grantName && (
        <div className="mt-2 pt-2 border-t border-border text-[11px] text-muted-foreground">{grantName}</div>
      )}
    </div>
  );
}