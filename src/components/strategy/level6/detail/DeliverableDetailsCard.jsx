import React, { useState, useEffect } from 'react';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import SectionCard from './SectionCard';
import BlockIdField from '@/components/strategy/BlockIdField';
import { blockIdLabel, isBlockIdTaken } from '@/lib/strategy/blockId';

const Field = ({ label, children }) => (
  <div className="space-y-1.5">
    <p className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wide">{label}</p>
    {children}
  </div>
);

const initial = (item) => ({ custom_id: item.custom_id || '', title: item.title || '', content: item.content || '' });

/** Record ID + Name + Description section with its own edit mode. */
export default function DeliverableDetailsCard({ item, levelName = '', onSave, saving }) {
  const [editing, setEditing] = useState(false);
  const [form, setForm] = useState(initial(item));
  const [idError, setIdError] = useState('');

  useEffect(() => { setForm(initial(item)); }, [item]);

  const save = async () => {
    setIdError('');
    const id = (form.custom_id || '').trim();
    if (id && await isBlockIdTaken(item.strategy_id, id, item.id)) {
      setIdError('This ID is already used in this strategy.');
      return;
    }
    await onSave({ ...form, custom_id: id });
    setEditing(false);
  };

  return (
    <SectionCard title="Details" onEdit={() => setEditing(true)} showEdit={!editing} className="h-full">
      <div className="space-y-4">
        {editing ? (
          <BlockIdField
            levelName={levelName}
            value={form.custom_id}
            onChange={(v) => setForm((f) => ({ ...f, custom_id: v }))}
            error={idError}
            compact
          />
        ) : (
          <Field label={blockIdLabel(levelName)}>
            <p className="text-sm text-foreground">{item.custom_id || '—'}</p>
          </Field>
        )}
        <Field label="Name">
          {editing
            ? <Input value={form.title} onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))} />
            : <p className="text-sm text-foreground">{item.title}</p>}
        </Field>
        <Field label="Description">
          {editing
            ? <Textarea rows={3} placeholder="Brief description..." value={form.content} onChange={(e) => setForm((f) => ({ ...f, content: e.target.value }))} />
            : <p className="text-sm text-foreground">{item.content || '—'}</p>}
        </Field>
        {editing && (
          <div className="flex justify-end gap-2 pt-1">
            <Button variant="outline" onClick={() => { setEditing(false); setIdError(''); setForm(initial(item)); }}>Cancel</Button>
            <Button onClick={save} disabled={saving}>Save Changes</Button>
          </div>
        )}
      </div>
    </SectionCard>
  );
}