import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { updateBlock } from '@/lib/strategy';
import LinkedItemCard from '../../connections/LinkedItemCard';
import SectionCard from './SectionCard';
import ContributesToSection from '../../connections/ContributesToSection';

/** Connections section with its own edit mode. */
export default function DeliverableConnectionsCard({ item, strategy, blocks, onSaved }) {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState('');
  const [saving, setSaving] = useState(false);
  const currentId = item.contributes_to || '';
  const linked = blocks.find((b) => b.id === currentId) || null;

  const startEdit = () => {
    setDraft(currentId);
    setEditing(true);
  };

  const save = async () => {
    setSaving(true);
    try {
      await updateBlock(item.id, { contributes_to: draft || '' });
      onSaved();
      setEditing(false);
    } finally {
      setSaving(false);
    }
  };

  return (
    <SectionCard title="Connections" onEdit={startEdit} showEdit={!editing}>
      {editing ? (
        <div className="space-y-4">
          <ContributesToSection
            item={item}
            strategy={strategy}
            blocks={blocks}
            onSaved={onSaved}
            hideHeading
            draftValue={draft}
            onDraftChange={setDraft}
          />
          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={() => setEditing(false)} disabled={saving}>Cancel</Button>
            <Button onClick={save} disabled={saving}>{saving ? 'Saving...' : 'Save Changes'}</Button>
          </div>
        </div>
      ) : (
        <div className="space-y-2">
          <p className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wide">Contributes To</p>
          {linked ? (
            <LinkedItemCard block={linked} strategy={strategy} />
          ) : (
            <p className="text-sm text-muted-foreground italic">None linked</p>
          )}
        </div>
      )}
    </SectionCard>
  );
}