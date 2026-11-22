import React from 'react';
import { SquarePen } from 'lucide-react';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import IconTip from '@/components/shared/IconTip';

/** One Strategic Foundations field — view mode by default, inline edit with its own Cancel / Save. */
export default function FoundationField({ label, optional, editing, canEdit, saving, onEdit, onCancel, onSave, view, children }) {
  return (
    <div className="rounded-xl bg-muted p-4">
      <div className="flex items-center justify-between gap-2 mb-1.5">
        <Label className="text-sm">
          {label} {optional && <span className="text-xs text-muted-foreground font-normal">(optional)</span>}
        </Label>
        {!editing && (
          <IconTip label={canEdit ? `Edit ${label}` : 'Save or cancel the field being edited first'}>
            <button
              type="button"
              onClick={onEdit}
              disabled={!canEdit}
              className="p-1 rounded-md text-muted-foreground hover:text-foreground hover:bg-background/60 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
            >
              <SquarePen className="w-4 h-4" />
            </button>
          </IconTip>
        )}
      </div>
      {editing ? (
        <>
          {children}
          <div className="flex justify-end gap-2 mt-3">
            <Button size="sm" variant="outline" onClick={onCancel} disabled={saving}>Cancel</Button>
            <Button size="sm" onClick={onSave} disabled={saving}>Save Changes</Button>
          </div>
        </>
      ) : view}
    </div>
  );
}