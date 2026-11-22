import React from 'react';
import CapsuleTabs from '@/components/board/CapsuleTabs';

/**
 * Strategy / Program / Project tabs. `animated` opts into the spring pill.
 * tabs: [{ id, label, count? }]
 */
export default function StrategyCapsuleTabs({ tabs, value, onChange, animated = false }) {
  return (
    <CapsuleTabs
      tabs={tabs.map((t) => ({ value: t.id, label: t.label, count: t.count }))}
      value={value}
      onChange={onChange}
      animated={animated}
      className="overflow-x-auto w-fit"
      tabClassName="whitespace-nowrap"
    />
  );
}