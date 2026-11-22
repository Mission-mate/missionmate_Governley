import React, { useState } from 'react';
import { Settings, Trash2, Layers, ChevronDown, ChevronRight, GripVertical } from 'lucide-react';
import { cn } from '@/lib/utils';
import useCollapse from '@/hooks/useCollapse';
import { getSystemField, isLockedSystemField } from '@/lib/membershipForm';
import { hasPlanVisibility } from '@/lib/conditionalLogic';
import { getMappableMemberFields } from '@/lib/membershipApplication';

// Human-readable field type shown under the label.
const typeOf = (field) => {
  if (field.kind === 'custom') return (field.type || 'Custom').toUpperCase();
  return (getSystemField(field.field_id)?.type || 'Text').toUpperCase();
};

/**
 * A field placed on the form canvas — compact, expandable row.
 * Collapsed: label, type, badges, and action icons.
 * Expanded: helper text, placeholder, mapping, and plan visibility summary.
 */
export default function CanvasFieldRow({ field, plans = [], customFields = [], onEdit, onRemove, dragHandleProps }) {
  const [open, setOpen] = useState(false);
  const reveal = useCollapse(open);
  const locked = isLockedSystemField(field);
  const planRestricted = hasPlanVisibility(field);

  const planNames = planRestricted
    ? (field.visibility_plans || []).map((id) => plans.find((p) => p.id === id)?.name).filter(Boolean)
    : [];

  const mappedLabel = field.map_to_field
    ? getMappableMemberFields(customFields).find((m) => m.id === field.map_to_field)?.label
    : null;

  return (
    <>
      <div className="bg-background border border-border rounded-lg overflow-hidden">
        <div className="group flex items-center gap-2 px-2 py-2">
          {dragHandleProps && (
            <span {...dragHandleProps} className="text-muted-foreground/40 hover:text-muted-foreground cursor-grab shrink-0">
              <GripVertical className="w-4 h-4" />
            </span>
          )}
          <button
            type="button"
            onClick={() => setOpen((v) => !v)}
            className="w-6 h-6 flex items-center justify-center rounded text-muted-foreground hover:text-foreground shrink-0"
          >
            {open ? <ChevronDown className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
          </button>

          <div className="flex-1 min-w-0" onClick={() => setOpen((v) => !v)} role="button">
            <div className="flex items-center gap-2">
              <p className={cn('text-sm font-semibold truncate', field.label ? 'text-foreground' : 'text-muted-foreground italic')}>
                {field.label || 'Untitled question'}
                {field.mandatory && <span className="text-destructive ml-1 not-italic">*</span>}
              </p>
              {planRestricted && (
                <span className="inline-flex items-center gap-1 shrink-0 rounded-full border border-primary/30 bg-primary/10 px-1.5 py-0.5 text-[10px] font-medium text-primary">
                  <Layers className="w-3 h-3" /> {planNames.length || 'Plan'}
                </span>
              )}
            </div>
            <p className="text-[11px] text-muted-foreground uppercase tracking-wide">{typeOf(field)}</p>
          </div>

          <div className="flex items-center gap-1 shrink-0">
            <button
              type="button"
              onClick={() => onEdit(field)}
              title="Field settings"
              className="w-8 h-8 flex items-center justify-center rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
            >
              <Settings className="w-4 h-4" />
            </button>
            {!locked && (
              <button
                type="button"
                onClick={onRemove}
                title="Remove field"
                className="w-8 h-8 flex items-center justify-center rounded-lg text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-colors"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            )}
          </div>
        </div>

        {reveal.mounted && (
          <div className={cn(reveal.className, 'px-4 pb-3 pt-1 bg-muted/30 border-t border-border text-xs space-y-1.5')}>
            {field.placeholder && (
              <p className="text-muted-foreground"><span className="font-medium text-foreground">Placeholder:</span> {field.placeholder}</p>
            )}
            {mappedLabel && (
              <p className="text-muted-foreground"><span className="font-medium text-foreground">Maps to:</span> {mappedLabel}</p>
            )}
            <p className="text-muted-foreground">
              <span className="font-medium text-foreground">Visibility:</span>{' '}
              {planRestricted ? `Only for ${planNames.join(', ') || 'selected plans'}` : 'All membership plans'}
            </p>
          </div>
        )}
      </div>
    </>
  );
}