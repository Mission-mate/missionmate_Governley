import React from 'react';
import CapsuleTabs from '@/components/board/CapsuleTabs';
import { HEALTH_TABS } from '@/lib/programs/deliverableView';

/** Deliverable health filter tabs — the shared spring-animated capsule switcher. */
export default function DeliverableHealthTabs({ value = '', onChange, counts }) {
  return (
    <CapsuleTabs animated
      tabs={HEALTH_TABS.map((t) => ({ value: t.value, label: t.label, count: counts[t.value] ?? 0 }))}
      value={value}
      onChange={onChange}
      showZeroCount
    />
  );
}