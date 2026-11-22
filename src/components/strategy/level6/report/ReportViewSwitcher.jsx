import React from 'react';
import CapsuleTabs from '@/components/board/CapsuleTabs';

/**
 * Capsule view switcher shown above the Level 6 reporting panel.
 * Tabs ({ key, label, count? }) are supplied by the caller; counts render as badges.
 */
export default function ReportViewSwitcher({ view, onChange, tabs, animated = false }) {
  return (
    <CapsuleTabs
      animated={animated}
      value={view}
      onChange={onChange}
      tabs={tabs.map((t) => ({ value: t.key, label: t.label, count: t.count }))}
    />
  );
}