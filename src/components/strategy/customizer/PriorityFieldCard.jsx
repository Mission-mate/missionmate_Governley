import React from 'react';
import { Checkbox } from '@/components/ui/checkbox';
import { PRIORITY_OPTIONS } from '@/components/strategy/priority';
import FieldCard from '@/components/shared/customizer/FieldCard';
import ReadOnlyOptions from '@/components/shared/customizer/ReadOnlyOptions';

/** Fixed palette tint per priority — locked, presentation only. */
const PRIORITY_COLOR = { High: 'red', Medium: 'orange', Low: 'green' };
const OPTIONS = PRIORITY_OPTIONS.map((name) => ({ name, color: PRIORITY_COLOR[name] || 'blue' }));

/**
 * Locked Priority system field — visibility is toggleable; the chevron reveals
 * its options, which are always view-only (no pencil).
 */
export default function PriorityFieldCard({ visible, onToggle }) {
  return (
    <FieldCard
      id="system:priority"
      title="Priority"
      canEdit={false}
      locked
      leading={<Checkbox checked={visible} onCheckedChange={(v) => onToggle(!!v)} />}
    >
      <ReadOnlyOptions options={OPTIONS} colored />
    </FieldCard>
  );
}