import React, { useState } from 'react';
import { useToast } from '@/components/ui/use-toast';
import { updateBlock } from '@/lib/strategy';
import DeliverableDetailsCard from './DeliverableDetailsCard';
import DeliverableMetaCard from './DeliverableMetaCard';
import DeliverableTrackingCard from './DeliverableTrackingCard';
import DeliverableConnectionsCard from './DeliverableConnectionsCard';

/** Section-based overview for the dedicated deliverable page. Each section saves on its own. */
export default function DeliverableOverview({ item, strategy, blocks = [], onSaved }) {
  const { toast } = useToast();
  const [saving, setSaving] = useState(false);

  const savePatch = async (patch) => {
    setSaving(true);
    try {
      // Saved directly — Reporting Frequency is optional metadata, no server-side gate.
      await updateBlock(item.id, { ...patch, strategy_id: item.strategy_id });
      toast({ title: 'Changes saved' });
      onSaved?.();
    } catch (err) {
      const msg = err?.response?.data?.error || err?.message || 'Something went wrong';
      toast({ title: 'Could not save', description: msg, variant: 'destructive' });
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 items-stretch">
        <DeliverableDetailsCard
          item={item}
          levelName={(strategy?.strategy_layers || []).find((l) => Number(l.level) === Number(item.level))?.name || ''}
          onSave={savePatch}
          saving={saving}
        />
        <DeliverableMetaCard item={item} strategy={strategy} onSave={savePatch} saving={saving} />
      </div>

      <DeliverableTrackingCard item={item} onSave={savePatch} saving={saving} />

      <DeliverableConnectionsCard item={item} strategy={strategy} blocks={blocks} onSaved={onSaved} />
    </div>
  );
}