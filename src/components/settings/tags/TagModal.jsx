import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import ModalOverlay from '@/components/ui/ModalOverlay';
import { cn } from '@/lib/utils';
import { TAG_COLORS as COLORS, getTagPillClasses } from '@/lib/tagColors';
import CloseButton from '@/components/shared/CloseButton';
import useUnsavedChanges from '@/hooks/useUnsavedChanges';

export function TagBadge({ name, color }) {
  return <span className={getTagPillClasses(color)}>{name}</span>;
}

export default function TagModal({ open, mode, tag, existingTags = [], onClose, onSave }) {
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [color, setColor] = useState('gray');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (open) {
      setName(tag?.name || '');
      setDescription(tag?.description || '');
      setColor(tag?.color || 'gray');
    }
  }, [open, tag]);

  const isView = mode === 'view';
  const isEdit = mode === 'edit';
  const isCreate = mode === 'create';

  // Exclude the record being edited by ID (not by name) so a second tag that
  // happens to share the same name is still detected as a duplicate.
  const takenNames = new Set(
    existingTags
      .filter(t => t.id !== tag?.id)
      .map(t => (t.name || '').trim().toLowerCase())
  );
  const isDuplicate = !!name.trim() && takenNames.has(name.trim().toLowerCase());

  const handleSave = async () => {
    if (!name.trim()) return;
    // Defensive re-check — never mutate on a duplicate, even if the disabled
    // Save button is bypassed programmatically.
    if (isDuplicate) return;
    setSaving(true);
    await onSave({ name: name.trim(), description: description.trim(), color });
    setSaving(false);
  };

  const guard = useUnsavedChanges({
    draft: { name, description, color },
    baseline: { name: tag?.name || '', description: tag?.description || '', color: tag?.color || 'gray' },
    onClose,
    saving,
    enabled: open && !isView,
  });

  return (
    <ModalOverlay isOpen={open} onClose={guard.requestClose} className="w-full max-w-md">
      <div className="bg-card rounded-xl shadow-xl p-6">
        {/* Header */}
        <div className="flex items-start justify-between mb-1">
          <div>
            <h2 className="text-lg font-bold text-foreground">
              {isCreate ? 'Create New Tag' : isEdit ? 'Edit Tag' : 'View Tag'}
            </h2>
            <p className="text-sm text-muted-foreground">Define a custom tag and its color.</p>
          </div>
          <CloseButton onClick={() => guard.requestClose()} />
        </div>

        <div className="space-y-4 mt-5">
          {/* Tag Name */}
          <div>
            <label className="text-sm font-medium text-foreground mb-1.5 block">Tag Name</label>
            <Input
              placeholder="e.g. VIP, Volunteer"
              value={name}
              onChange={e => setName(e.target.value)}
              disabled={isView}
            />
            {isDuplicate && !isView && (
              <p className="text-xs text-destructive mt-1.5">A tag with this name already exists.</p>
            )}
          </div>

          {/* Description */}
          <div>
            <label className="text-sm font-medium text-foreground mb-1.5 block">Description (Optional)</label>
            <Input
              placeholder="Short description of this tag"
              value={description}
              onChange={e => setDescription(e.target.value)}
              disabled={isView}
            />
          </div>

          {/* Color */}
          <div>
            <label className="text-sm font-medium text-foreground mb-2 block">Color</label>
            <div className="flex items-center gap-2 flex-wrap">
              {COLORS.map(c => (
                <button
                  key={c.key}
                  disabled={isView}
                  onClick={() => setColor(c.key)}
                  className={cn(
                    'w-8 h-8 rounded-full border-2 transition-all',
                    color === c.key ? 'border-primary scale-110 shadow' : 'border-border hover:border-primary/50'
                  )}
                  style={{ backgroundColor: c.preview }}
                />
              ))}
            </div>
          </div>

          {/* Preview */}
          <div className="bg-secondary/50 rounded-lg px-4 py-3 flex items-center gap-3">
            <span className="text-sm text-muted-foreground">Preview:</span>
            <TagBadge name={name || 'Tag Name'} color={color} />
          </div>
        </div>

        {/* Footer */}
        {!isView && (
          <div className="flex items-center justify-end gap-3 mt-6">
            <Button variant="outline" onClick={() => guard.requestClose()}>Cancel</Button>
            <Button onClick={handleSave} disabled={!name.trim() || isDuplicate || saving}>
              {saving ? 'Saving...' : isCreate ? 'Create Tag' : 'Save Changes'}
            </Button>
          </div>
        )}
        {isView && (
          <div className="flex justify-end mt-6">
            <Button variant="outline" onClick={onClose}>Close</Button>
          </div>
        )}
      </div>
      {guard.dialog}
    </ModalOverlay>
  );
}