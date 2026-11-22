import React from 'react';
import { useNavigate } from 'react-router-dom';
import { ChevronDown, Link2 } from 'lucide-react';
import CircleCheck from '@/components/shared/CircleCheck';
import PersonInitialsAvatar from '@/components/shared/PersonInitialsAvatar';
import { formatReviewDate } from '@/lib/complianceRegisters';
import PolicyAvatar from './PolicyAvatar';
import StrategyCustomCell from '@/components/strategy/customFields/StrategyCustomCell';
import PolicyBadge from './PolicyBadge';
import { overdueNote } from './policyFormat';

const CELL = 'py-3 px-3 text-sm text-foreground/80';

export default function PolicyRow({ doc, child, last, muted, columns = [], linkedCount = 0, expanded, onToggle, selected, onSelect, className = '' }) {
  const navigate = useNavigate();
  const overdue = overdueNote(doc);
  return (
    <tr className={`${className} border-b border-border/40 transition-colors ${selected ? 'bg-primary/10' : child ? 'bg-muted/20 hover:bg-sidebar-accent/70' : 'hover:bg-sidebar-accent/70'} ${muted ? 'opacity-50' : ''}`}>
      <td className="py-3 pl-4 pr-0">{!muted && <CircleCheck checked={selected} onChange={onSelect} />}</td>
      <td className={`py-3 px-3 ${child ? 'relative' : ''}`}>
        {child && (
          <span aria-hidden="true">
            <span className="absolute left-6 top-0 h-1/2 w-5 border-l border-b border-muted-foreground/40 rounded-bl-lg" />
            {!last && <span className="absolute left-6 top-1/2 bottom-0 border-l border-muted-foreground/40" />}
          </span>
        )}
        <div className={`flex items-center gap-2.5 ${child ? 'pl-12' : ''}`}>
          {!child && (
            <span className="w-6 shrink-0">
              {linkedCount > 0 && (
                <button type="button" onClick={onToggle} title={expanded ? 'Collapse' : 'Expand'}
                  className="h-6 w-6 rounded-full flex items-center justify-center text-muted-foreground hover:bg-muted hover:text-foreground transition-colors">
                  <ChevronDown className={`w-4 h-4 transition-transform ${expanded ? '' : '-rotate-90'}`} />
                </button>
              )}
            </span>
          )}
          <PolicyAvatar title={doc.title} small={child} />
          <div className="min-w-0">
            <button onClick={() => navigate(`/compliance/policy/${doc.id}`)} className="block text-sm font-semibold text-foreground hover:text-primary transition-colors text-left truncate max-w-full">
              {doc.title}
            </button>
            <p className="text-xs text-muted-foreground flex items-center gap-1">
              {doc.document_type}
              {child && doc.review_with_parent && <span>· reviewed with parent</span>}
              {linkedCount > 0 && <span className="text-primary font-medium flex items-center gap-0.5">· <Link2 className="w-3 h-3" />{linkedCount} linked</span>}
            </p>
          </div>
        </div>
      </td>
      <td className={CELL}>
        {doc.owner ? <span className="flex items-center gap-2 min-w-0"><PersonInitialsAvatar name={doc.owner} className="h-7 w-7 text-[11px]" /><span className="truncate">{doc.owner}</span></span> : '—'}
      </td>
      <td className="py-3 px-3"><PolicyBadge value={doc.stage} /></td>
      <td className={CELL}>{formatReviewDate(doc.last_review_date)}</td>
      <td className="py-3 px-3">
        <span className={`text-sm ${overdue ? 'text-red-600 dark:text-red-400 font-medium' : 'text-foreground/80'}`}>{formatReviewDate(doc.next_review_date)}</span>
        {overdue && <p className="text-[11px] text-red-600 dark:text-red-400 mt-0.5">{overdue}</p>}
      </td>
      <td className="py-3 px-3"><PolicyBadge value={doc.status} /></td>
      {columns.map((c) => <td key={c.id} className="py-3 px-3"><StrategyCustomCell column={c} value={doc.custom_fields?.[c.id]} /></td>)}
    </tr>
  );
}