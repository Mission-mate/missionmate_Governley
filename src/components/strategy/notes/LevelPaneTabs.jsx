import React from 'react';
import CapsuleTabs from '@/components/board/CapsuleTabs';
import useRecordTabCounts from '@/hooks/useRecordTabCounts';
import { STRATEGY_BLOCK_NOTES } from './levelNotes';

/** Overview / Notes / Documents capsule switcher for strategy level drawers, with server-side counts. */
export default function LevelPaneTabs({ itemId, value, onChange }) {
  const counts = useRecordTabCounts(STRATEGY_BLOCK_NOTES, itemId, { notes: 'pane' });
  return (
    <div className="mt-4">
      <CapsuleTabs animated
        value={value}
        onChange={onChange}
        className="w-fit"
        tabs={[
          { value: 'overview', label: 'Overview' },
          { value: 'notes', label: 'Notes', count: counts.notes },
          { value: 'documents', label: 'Documents', count: counts.documents },
        ]}
      />
    </div>
  );
}