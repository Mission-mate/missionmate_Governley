import React from 'react';
import { Check, Plus, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';

/**
 * Shared card for a compliance library obligation item.
 * Used both in the Compliance Library pane (home page — remove action) and
 * inside the register's "Add from Library" panel (add action).
 *
 * action = 'add'    → shows an Add / Added button on the right.
 * action = 'remove' → shows a trash icon button on the right.
 */
export default function LibraryItemCard({
  item,
  action = 'add',
  added = false,
  busy = false,
  onAdd,
  onRemove,
}) {
  return (
    <div className="flex items-center gap-2 px-3.5 py-2.5 rounded-xl border border-border bg-card shadow-sm dark:bg-muted/40 hover:shadow-md transition-shadow">
      <div className="min-w-0 flex-1">
        <p className="text-sm font-semibold text-foreground break-words">{item.title}</p>
        {(item.category || item.regulator) && (
          <div className="flex flex-wrap items-center gap-x-2 gap-y-0.5 mt-0.5 text-xs text-foreground">
            {item.category && <span><span className="text-foreground">Category:</span> {item.category}</span>}
            {item.category && item.regulator && <span className="text-foreground">·</span>}
            {item.regulator && <span><span className="text-foreground">Regulator:</span> {item.regulator}</span>}
          </div>
        )}
      </div>

      {action === 'add' ? (
        <Button
          size="sm"
          variant={added ? 'outline' : 'default'}
          disabled={added || busy}
          onClick={onAdd}
          className="h-7 px-2.5 text-xs shrink-0"
        >
          {busy ? (
            <div className="w-3.5 h-3.5 border-2 border-white/40 border-t-white rounded-full animate-spin" />
          ) : added ? (
            <><Check className="w-3.5 h-3.5" /> Added</>
          ) : (
            <><Plus className="w-3.5 h-3.5" /> Add</>
          )}
        </Button>
      ) : (
        <button
          onClick={onRemove}
          disabled={busy}
          className="w-7 h-7 flex items-center justify-center rounded-md text-muted-foreground hover:text-destructive hover:bg-destructive/5 transition-colors shrink-0"
          title="Remove from library"
        >
          {busy ? (
            <div className="w-3.5 h-3.5 border-2 border-destructive/30 border-t-destructive rounded-full animate-spin" />
          ) : (
            <Trash2 className="w-4 h-4" />
          )}
        </button>
      )}
    </div>
  );
}