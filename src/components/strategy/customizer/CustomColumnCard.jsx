import React from 'react';
import { Plus, Trash2, GripVertical, Eye, EyeOff } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { OPTION_COLORS } from '@/lib/registerColors';
import FieldOptionRow from './FieldOptionRow';
import IconTip from '@/components/shared/IconTip';
import useRemovalConfirm from '@/components/shared/customizer/useRemovalConfirm';
import FieldCard from '@/components/shared/customizer/FieldCard';
import ReadOnlyOptions from '@/components/shared/customizer/ReadOnlyOptions';
import { useFieldEdit } from '@/components/shared/customizer/fieldEditMode';

const LABEL = 'block text-[11px] font-medium uppercase tracking-wide text-muted-foreground';

/**
 * Collapsible custom column card. Expanded it shows the column's type and options
 * view-only; the pencil enables renaming and (Single Select) option editing, saved
 * by the card's own Save. `onUpdate` edits the draft; `onSetVisible` and `onRemove`
 * save at once. `savedCol` is the column's saved version (absent for unsaved columns) —
 * removing a saved column (typed DELETE) or saved option asks for confirmation first.
 */
export default function CustomColumnCard({ col, savedCol, onUpdate, onRemove, onSetVisible, showVisibility = true, dragHandleProps = null }) {
  const { editing } = useFieldEdit(col.id);
  const { confirm, dialog } = useRemovalConfirm();

  const opts = col.config?.options || [];
  const isSelect = col.type === 'Single Select';

  const setOptions = (options) => onUpdate({ ...col, config: { ...col.config, options } });
  const savedOptionNames = new Set((savedCol?.config?.options || []).map((o) => o.name));
  const removeOption = (idx) => {
    const next = opts.filter((_, i) => i !== idx);
    if (opts[idx].name && savedOptionNames.has(opts[idx].name)) confirm('option', opts[idx].name, () => setOptions(next));
    else setOptions(next);
  };
  const removeColumn = () => (savedCol ? confirm('column', col.title, onRemove) : onRemove());
  // A blank title falls back to the last saved name so a column is never untitled.
  const restoreBlankTitle = () => { if (!col.title.trim()) onUpdate({ ...col, title: savedCol?.title || 'Untitled column' }); };

  const leading = dragHandleProps && (
    <span {...dragHandleProps} title="Drag to reorder" className="text-muted-foreground/60 hover:text-foreground cursor-grab active:cursor-grabbing shrink-0">
      <GripVertical className="w-4 h-4" />
    </span>
  );

  const actions = (
    <>
      {showVisibility && (
        <IconTip label={col.table_visible ? 'Shown in table · click to hide' : 'Hidden from table · click to show'}>
          <button
            onClick={() => onSetVisible(!col.table_visible)}
            className={col.table_visible ? 'text-primary hover:opacity-80 p-0.5' : 'text-muted-foreground hover:text-foreground p-0.5'}
          >
            {col.table_visible ? <Eye className="w-4 h-4" /> : <EyeOff className="w-4 h-4" />}
          </button>
        </IconTip>
      )}
      <IconTip label="Delete column">
        <button onClick={removeColumn} className="text-muted-foreground hover:text-destructive p-0.5">
          <Trash2 className="w-4 h-4" />
        </button>
      </IconTip>
    </>
  );

  return (
    <>
      <FieldCard id={col.id} title={col.title} leading={leading} actions={actions}>
        {editing ? (
          <div className="space-y-3">
            <div className="space-y-1">
              <span className={LABEL}>Column title</span>
              <Input value={col.title} onChange={(e) => onUpdate({ ...col, title: e.target.value })} onBlur={restoreBlankTitle} className="h-8" />
            </div>
            {isSelect && (
              <div className="space-y-1.5">
                <span className={LABEL}>Options</span>
                {opts.map((opt, idx) => (
                  <FieldOptionRow
                    key={idx}
                    opt={opt}
                    onChange={(v) => setOptions(opts.map((o, i) => (i === idx ? v : o)))}
                    onRemove={() => removeOption(idx)}
                  />
                ))}
                <button
                  onClick={() => setOptions([...opts, { name: '', color: OPTION_COLORS[opts.length % OPTION_COLORS.length].id }])}
                  className="flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground pt-1"
                >
                  <Plus className="w-3 h-3" /> Add option
                </button>
              </div>
            )}
          </div>
        ) : (
          <div className="space-y-2">
            <p className="text-sm text-foreground"><span className="text-muted-foreground">Type: </span>{col.type}</p>
            {isSelect && <div className="space-y-1.5"><ReadOnlyOptions options={opts} colored /></div>}
          </div>
        )}
      </FieldCard>
      {dialog}
    </>
  );
}