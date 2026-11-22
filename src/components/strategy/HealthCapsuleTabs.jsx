import React from 'react';
import CapsuleTabs from '@/components/board/CapsuleTabs';

const TABS = [
  { value: '', label: 'All' },
  { value: 'on_track', label: 'On Track' },
  { value: 'at_risk', label: 'At Risk' },
  { value: 'off_track', label: 'Off Track' },
];

/** Health filter tabs for strategy level tables — the shared spring-animated capsule switcher. */
export default function HealthCapsuleTabs({ value = '', onChange, counts }) {
  return (
    <CapsuleTabs animated
      tabs={TABS.map((t) => ({ ...t, count: counts?.[t.value] }))}
      value={value}
      onChange={onChange}
      showZeroCount
    />
  );
}