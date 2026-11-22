import React from 'react';
import { Link } from 'react-router-dom';
import { Plus, Link2, Unlink } from 'lucide-react';
import { Button } from '@/components/ui/button';
import PolicyAvatar from './PolicyAvatar';
import PolicyBadge from './PolicyBadge';
import { ELEVATED_CARD } from '@/components/shared/cardStyles';

const GRID = 'grid grid-cols-[minmax(0,1fr)_7rem_6rem_2rem] sm:grid-cols-[minmax(0,1fr)_9rem_8rem_2rem] items-center gap-3 px-5';

export default function LinkedDocumentsCard({ children, onAddNew, onLinkExisting, onUnlink }) {
  return (
    <div className={`${ELEVATED_CARD} overflow-hidden`}>
      <div className="flex items-center justify-between gap-3 px-7 py-5 border-b border-border">
        <div>
          <h3 className="text-base font-semibold text-foreground">Related Documents</h3>
          <p className="text-xs text-muted-foreground">Guidelines, procedures, forms and other documents supporting this policy</p>
        </div>
        <div className="flex gap-2">
          <Button size="sm" variant="outline" onClick={onLinkExisting}><Link2 className="w-3.5 h-3.5" /> Link Existing</Button>
          <Button size="sm" onClick={onAddNew}><Plus className="w-3.5 h-3.5" /> Add New</Button>
        </div>
      </div>
      {children.length === 0 ? <p className="py-10 text-center text-sm text-muted-foreground">No linked documents yet</p> : (
        <ul className="divide-y divide-border">
          <li className={`${GRID} py-2.5 bg-muted/40 text-xs font-semibold text-muted-foreground`}>
            <span>Title</span><span>Stage</span><span>Status</span><span />
          </li>
          {children.map((c) => (
            <li key={c.id} className={`${GRID} py-3`}>
              <div className="flex items-center gap-3 min-w-0">
                <PolicyAvatar title={c.title} small />
                <div className="min-w-0">
                  <Link to={`/compliance/policy/${c.id}`} className="block text-sm font-semibold text-foreground hover:text-primary truncate">{c.title}</Link>
                  <p className="text-xs text-muted-foreground truncate">{c.document_type}{c.review_with_parent ? ' · reviewed with parent' : ''}</p>
                </div>
              </div>
              <div><PolicyBadge value={c.stage} /></div>
              <div><PolicyBadge value={c.status} /></div>
              <button onClick={() => onUnlink(c)} title="Unlink document" className="p-1.5 rounded-md text-muted-foreground hover:text-destructive hover:bg-muted transition-colors">
                <Unlink className="w-4 h-4" />
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}