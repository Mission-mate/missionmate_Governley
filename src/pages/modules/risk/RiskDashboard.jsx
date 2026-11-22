import React, { useState } from 'react';
import CapsuleTabs from '@/components/board/CapsuleTabs';
import RiskOverviewTab from '@/components/risk/dashboard/RiskOverviewTab';
import RiskGuideTab from '@/components/risk/guide/RiskGuideTab';
import RiskReportTab from '@/components/risk/report/RiskReportTab';

const TABS = [
  { value: 'overview', label: 'Overview' },
  { value: 'analytics', label: 'Risk Analytics' },
  { value: 'guide', label: 'Risk Guide' },
];

const TAB_SUBTITLES = {
  overview: 'Visual insights into your risk management framework',
  analytics: 'Board-ready executive risk reporting',
  guide: 'Understand your risk management framework',
};

export default function RiskDashboard() {
  const [tab, setTab] = useState('overview');

  return (
    <div className="p-6 lg:p-8 max-w-7xl mx-auto">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-foreground tracking-tight">Risk Dashboard</h1>
        <p className="text-sm text-muted-foreground mt-1">{TAB_SUBTITLES[tab]}</p>
      </div>

      <div className="mb-6">
        <CapsuleTabs animated tabs={TABS} value={tab} onChange={setTab} />
      </div>

      {tab === 'overview' && <RiskOverviewTab />}
      {tab === 'guide' && <RiskGuideTab />}
      {tab === 'analytics' && <RiskReportTab />}
    </div>
  );
}