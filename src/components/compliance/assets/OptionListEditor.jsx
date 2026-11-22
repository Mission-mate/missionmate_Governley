import React from 'react';
import { X, Plus, Lock } from 'lucide-react';
import { optionId } from '@/lib/assetRegister';
import useRemovalConfirm from '@/components/shared/customizer/useRemovalConfirm';
import FieldCard from '@/components/shared/customizer/FieldCard';
import ReadOnlyOptions from '@/components/shared/customizer/ReadOnlyOptions';
import { useFieldEdit } from '@/components/shared/customizer/fieldEditMode';

/**
 * Collapsible system-field card with an option list — view-only until the pencil enables editing.
 * `fixedIds`: options that stay renamable but cannot be removed.
 * `savedIds`: saved options — removing one asks for confirmation first. Changes are saved by the card's Save.
 */
export default function OptionListEditor({ id, label, options, onChange, lockedNames = [], fixedIds, savedIds }) {
  const { editing } = useFieldEdit(id);
  const { confirm, dialog } = useRemovalConfirm();
  const update = (oid, name) => onChange(options.map((o) => (o.id === oid ? { ...o, name } : o)));
  const remove = (o) => {
    const next = options.filter((x) => x.id !== o.id);
    if (savedIds?.has(o.id)) confirm('option', o.name, () => onChange(next));
    else onChange(next);
  };

  return (
    <>
      <FieldCard id={id} title={label} locked actions={<span className="text-xs text-muted-foreground">{options.length} options</span>}>
        {editing ? (
          <>
            {options.map((o) => {
              const locked = lockedNames.includes(o.name);
              return (
                <div key={o.id} className="flex items-center gap-2">
                  <input
                    value={o.name}
                    readOnly={locked}
                    onChange={(e) => update(o.id, e.target.value)}
                    placeholder="Option name"
                    className="flex-1 h-8 rounded-md border border-input bg-background px-2 text-sm outline-none focus:ring-1 focus:ring-ring read-only:bg-muted/40 read-only:text-muted-foreground"
                  />
                  {locked || fixedIds?.has(o.id) ? (
                    <Lock className="w-3.5 h-3.5 text-muted-foreground/60 shrink-0" title="This option cannot be removed" />
                  ) : (
                    <button type="button" onClick={() => remove(o)} className="text-muted-foreground hover:text-destructive shrink-0">
                      <X className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>
              );
            })}
            <button onClick={() => onChange([...options, { id: optionId(), name: '' }])} className="flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground pt-1">
              <Plus className="w-3 h-3" /> Add option
            </button>
          </>
        ) : (
          <ReadOnlyOptions options={options} />
        )}
      </FieldCard>
      {dialog}
    </>
  );
}