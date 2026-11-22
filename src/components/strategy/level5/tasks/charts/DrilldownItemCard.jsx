import React from 'react';
import { format, parseISO } from 'date-fns';
import { ExternalLink } from 'lucide-react';
import { isOverdue, STATUS_COLORS, HEALTH_COLORS } from './taskChartData';

const Pill = ({ text, color }) => (
  <span
    className="text-[11px] font-medium rounded-full px-2 py-0.5"
    style={{ color, backgroundColor: `${color}1A` }}
  >
    {text}
  </span>
);

const fmt = (v) => { try { return format(parseISO(v), 'd MMM yyyy'); } catch { return v; } };

/** Read-only summary card for one task / milestone inside a chart drilldown pane. */
export default function DrilldownItemCard({ item, onOpen }) {
  const status = item.status || 'Not Started';
  const health = item.health || 'Not Set';
  const overdue = isOverdue(item);

  return (
    <div className="border border-border rounded-xl p-3 shadow-sm bg-card">
      <div className="flex items-start justify-between gap-2">
        <div className="flex items-center gap-2 min-w-0">
          <span className="text-[10px] uppercase tracking-wider font-semibold rounded-md px-1.5 py-0.5 bg-muted text-muted-foreground">
            {item.type === 'milestone' ? 'Milestone' : 'Task'}
          </span>
          {item.custom_id && <span className="text-[11px] text-muted-foreground truncate">{item.custom_id}</span>}
          <span className="text-[11px] text-muted-foreground truncate">· {item.owner || 'Unassigned'}</span>
        </div>
        <button onClick={() => onOpen(item)} className="text-muted-foreground hover:text-primary transition-colors">
          <ExternalLink className="w-4 h-4" />
        </button>
      </div>
      <div className="mt-1.5 text-xs font-normal text-foreground">{item.title || 'Untitled'}</div>
      <div className="mt-2 flex items-center gap-1.5 flex-wrap">
        <span className="text-[11px] text-muted-foreground">Status:</span>
        <Pill text={status} color={STATUS_COLORS[status] || '#94a3b8'} />
        <span className="text-[11px] text-muted-foreground ml-1">Health:</span>
        <Pill text={health} color={HEALTH_COLORS[health] || '#cbd5e1'} />
        {item.due_date && (
          <span className={`text-[11px] ${overdue ? 'text-red-600 font-medium' : 'text-muted-foreground'}`}>
            Due {fmt(item.due_date)}
          </span>
        )}
      </div>
    </div>
  );
}