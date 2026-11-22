import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { listRisks } from '@/lib/riskApi';
import RiskScoreCards from './RiskScoreCards';
import RatingPieChart from './RatingPieChart';
import CategoryBarChart from './CategoryBarChart';
import RiskHeatmap from './RiskHeatmap';
import RiskAppetitePanel from './RiskAppetitePanel';
import TopRisksChart from './TopRisksChart';
import useAppetiteThreshold from '@/hooks/useAppetiteThreshold';
import ModuleLoader from '@/components/shared/states/ModuleLoader';
import LoadError from '@/components/shared/states/LoadError';

export default function RiskOverviewTab() {
  const { data: risks = [], isLoading, ...read } = useQuery({ queryKey: ['risks'], queryFn: listRisks });
  const { threshold, setThreshold, persist } = useAppetiteThreshold();

  if (isLoading) {
    return <ModuleLoader />;
  }

  // A failed read must never render as an empty dashboard.
  if (read.isLoadingError) {
    return <LoadError failure={read} title="Couldn’t load the dashboard" />;
  }

  return (
    <div>
      <RiskScoreCards risks={risks} appetiteThreshold={threshold} />
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mb-4 items-start">
        <RiskHeatmap risks={risks} />
        <div className="flex flex-col gap-4">
          <RiskAppetitePanel risks={risks} threshold={threshold} setThreshold={setThreshold} persist={persist} />
          <TopRisksChart risks={risks} />
        </div>
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <RatingPieChart risks={risks} />
        <CategoryBarChart risks={risks} />
      </div>
    </div>
  );
}