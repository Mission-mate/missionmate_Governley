import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import ModalOverlay from '@/components/ui/ModalOverlay';
import DateField from '@/components/ui/DateField';
import { toast } from '@/components/ui/use-toast';
import { FOLDER_COLORS } from '@/components/documents/FolderIcon';
import NoteIcon, { DEFAULT_NOTE_COLOR } from '@/components/notes/NoteIcon';
import { localToday } from '@/lib/localClock';
import { cn } from '@/lib/utils';
import useUnsavedChanges from '@/hooks/useUnsavedChanges';

const LABEL = 'text-xs font-semibold text-foreground block mb-1.5';

const formFrom = (note, defaultOwner) => ({
  title: note?.title || '',
  owner_name: note ? note.owner_name || '' : defaultOwner || '',
  page_date: note ? note.page_date || '' : localToday(),
  color: note?.color || DEFAULT_NOTE_COLOR,
});

/** Create / edit a note's details: title, owner, date and colour. `note` null = create. */
export default function NoteFormModal({ isOpen, note = null, defaultOwner = '', onConfirm, onCancel }) {
  const [form, setForm] = useState(formFrom(note, defaultOwner));
  const [saving, setSaving] = useState(false);
  const set = (patch) => setForm((f) => ({ ...f, ...patch }));

  useEffect(() => {
    if (isOpen) { setForm(formFrom(note, defaultOwner)); setSaving(false); }
  }, [isOpen]);

  const handle = async () => {
    if (!form.title.trim() || saving) return;
    setSaving(true);
    try {
      await onConfirm({ ...form, title: form.title.trim(), owner_name: form.owner_name.trim() });
    } catch {
      toast({ variant: 'destructive', title: 'Couldn’t save note', description: 'Something went wrong. Please try again.' });
    } finally {
      setSaving(false);
    }
  };

  const guard = useUnsavedChanges({
    draft: form, baseline: formFrom(note, defaultOwner), onClose: onCancel, saving, enabled: isOpen,
  });

  return (
    <ModalOverlay isOpen={isOpen} onClose={guard.requestClose} className="w-full max-w-sm">
      <div className="bg-card rounded-xl shadow-2xl p-6">
        <h2 className="text-lg font-bold text-foreground mb-5">{note ? 'Edit Note' : 'Create New Note'}</h2>

        <label className={LABEL}>Note Title</label>
        <div className="flex items-center gap-2.5 mb-4">
          <div className="h-9 w-9 shrink-0 rounded-md border border-input bg-muted/40 flex items-center justify-center">
            <NoteIcon color={form.color} size={22} />
          </div>
          <Input
            value={form.title}
            onChange={(e) => set({ title: e.target.value })}
            placeholder="e.g. Meeting summary"
            autoFocus
            onKeyDown={(e) => e.key === 'Enter' && handle()} />
        </div>

        <div className="grid grid-cols-2 gap-3 mb-4">
          <div>
            <label className={LABEL}>Owner</label>
            <Input value={form.owner_name} onChange={(e) => set({ owner_name: e.target.value })} placeholder="Add owner" />
          </div>
          <div>
            <label className={LABEL}>Date</label>
            <DateField value={form.page_date} onChange={(page_date) => set({ page_date })} />
          </div>
        </div>

        <label className="text-xs font-semibold text-foreground block mb-2">Note Colour</label>
        <div className="flex items-center gap-3 mb-6">
          {FOLDER_COLORS.map((c) => (
            <button
              key={c.key}
              type="button"
              onClick={() => set({ color: c.key })}
              aria-label={`${c.key} note`}
              aria-pressed={form.color === c.key}
              title={c.key}
              className={cn(
                'rounded-full flex items-center justify-center transition-all',
                form.color === c.key ? 'ring-2 ring-offset-2 ring-offset-card ring-foreground scale-110' : 'hover:scale-105'
              )}>
              <NoteIcon color={c.key} size={40} />
            </button>
          ))}
        </div>

        <div className="flex items-center justify-end gap-3">
          <Button variant="outline" onClick={() => guard.requestClose()}>Cancel</Button>
          <Button onClick={handle} disabled={!form.title.trim() || saving}>
            {saving ? 'Saving...' : note ? 'Save Changes' : 'Create Note'}
          </Button>
        </div>
      </div>
      {guard.dialog}
    </ModalOverlay>
  );
}