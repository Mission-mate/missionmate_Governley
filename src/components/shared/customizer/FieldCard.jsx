import React from 'react';
import { motion, AnimatePresence, useReducedMotion } from 'framer-motion';
import { ChevronRight, Pencil, Lock } from 'lucide-react';
import { cn } from '@/lib/utils';
import IconTip from '@/components/shared/IconTip';
import { Button } from '@/components/ui/button';
import { useFieldEdit } from './fieldEditMode';

const EASE = [0.2, 0.7, 0.2, 1];

/**
 * Collapsible Customise Fields card: leading chevron toggles the body (slide-down
 * reveal), the pencil switches the card into edit mode, which adds the card's own
 * Cancel / Save. Body content decides what to render from `useFieldEdit(id).editing`.
 */
export default function FieldCard({ id, title, meta, leading, actions, canEdit = true, locked = false, children }) {
  const { expanded, editing, locked: blocked, toggle, edit, save, cancel, saving, busy } = useFieldEdit(id);
  const reduce = useReducedMotion();
  const hidden = reduce ? { opacity: 0, overflow: 'hidden' } : { height: 0, opacity: 0, y: -6, overflow: 'hidden' };

  // While another field is being edited this card is grayed and fully non-interactive.
  return (
    <div
      inert={blocked ? '' : undefined}
      aria-disabled={blocked || undefined}
      title={blocked ? 'Save or cancel the field you are editing first' : undefined}
      className={cn(
        'border rounded-lg bg-muted/10 transition-[opacity,border-color,filter] duration-200',
        editing ? 'border-primary/40' : 'border-border',
        blocked && 'opacity-50 grayscale pointer-events-none select-none'
      )}
    >
      <div className="flex items-center gap-2 px-3 py-2.5">
        <button
          type="button"
          onClick={toggle}
          aria-expanded={expanded}
          aria-label={expanded ? 'Collapse field' : 'Expand field'}
          className="-ml-1 p-0.5 rounded text-muted-foreground hover:text-foreground hover:bg-accent transition-colors shrink-0"
        >
          <ChevronRight className={cn('w-4 h-4 transition-transform duration-200', expanded && 'rotate-90')} />
        </button>
        {leading}
        <button type="button" onClick={toggle} className="flex-1 min-w-0 text-left">
          <span className="block text-sm font-medium text-foreground truncate">{title}</span>
          {meta && <span className="block text-[11px] text-muted-foreground">{meta}</span>}
        </button>
        <div className="flex items-center gap-1.5 shrink-0">
          {actions}
          {canEdit && (
            <IconTip label={editing ? 'Editing' : 'Edit field'}>
              <button
                type="button"
                onClick={edit}
                className={cn('p-0.5 transition-colors', editing ? 'text-primary' : 'text-muted-foreground hover:text-foreground')}
              >
                <Pencil className="w-4 h-4" />
              </button>
            </IconTip>
          )}
          {locked && <Lock className="w-4 h-4 text-muted-foreground/40" title="System field — locked" />}
        </div>
      </div>
      <AnimatePresence initial={false}>
        {expanded && (
          <motion.div
            key="body"
            initial={hidden}
            animate={{ height: 'auto', opacity: 1, y: 0, transitionEnd: { overflow: 'visible' } }}
            exit={hidden}
            transition={{ duration: reduce ? 0.12 : 0.24, ease: EASE }}
          >
            <div className="px-3 pb-3 pt-2 border-t border-border space-y-1.5">
              {children}
              {editing && (
                <div className="flex items-center justify-end gap-2 pt-2">
                  <Button variant="outline" size="sm" onClick={cancel} disabled={saving}>Cancel</Button>
                  <Button size="sm" onClick={save} disabled={busy}>{saving ? 'Saving...' : 'Save'}</Button>
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}