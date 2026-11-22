import React, { useState } from 'react';
import { Landmark, DollarSign, ShieldCheck, AlertTriangle, FileText } from 'lucide-react';
import ObligationSummaryPane from '@/components/grants/reporting/ObligationSummaryPane';
import { useGrantAnalytics, formatCurrencyFull } from '@/hooks/useGrantAnalytics';
import StatCard from '@/components/grants/dashboard/StatCard';
import FundingByProviderChart from '@/components/grants/dashboard/FundingByProviderChart';
import GrantDonutChart from '@/components/grants/dashboard/GrantDonutChart';
import ModuleLoader from '@/components/shared/states/ModuleLoader';
import LoadError from '@/components/shared/states/LoadError';

const STATUS_LABELS = {
  not_started: 'Not Started',
  in_progress: 'In Progress',
  complete: 'Complete',
  overdue: 'Overdue',
};

const STATUS_COLORS = {
  not_started: 'hsl(var(--chart-1))',
  in_progress: 'hsl(var(--chart-4))',
  complete: 'hsl(var(--chart-2))',
  overdue: 'hsl(var(--chart-5))',
};

export default function GrantDashboard() {
  const a = useGrantAnalytics();
  const [summary, setSummary] = useState(null);

  // Groups are keyed by lookup ID; `label` is resolved from the canonical record.
  // A group with no ID link is flagged so a data gap reads as a gap, not a provider.
  const displayLabel = (d) => (d.unlinked ? `${d.label} (unlinked)` : d.label);
  const activityDonut = (a.byProgram || []).map((d) => ({ name: displayLabel(d), value: d.amount }));
  const providerDonut = (a.byProvider || []).map((d) => ({ name: displayLabel(d), value: d.amount }));
  const obligationDonut = (a.obligationStatus || []).map((d) => ({
    name: STATUS_LABELS[d.status] || d.status,
    value: d.count,
    color: STATUS_COLORS[d.status],
  }));
  const obligationTotal = (a.obligationStatus || []).reduce((sum, d) => sum + d.count, 0);

  // Bars flow lowest (top) to highest (bottom) — recharts vertical layout renders index 0 at the top.
  const byAmountAsc = (rows) =>
    [...(rows || [])].map((d) => ({ ...d, label: displayLabel(d) })).sort((x, y) => x.amount - y.amount);
  const providerBars = byAmountAsc(a.byProvider);
  const activityBars = byAmountAsc(a.byProgram);

  if (a.isLoading) {
    return <ModuleLoader fullPage />;
  }

  if (a.failure.isLoadingError) {
    return <LoadError page failure={a.failure} title="Couldn’t load the dashboard" />;
  }

  return (
    <div className="p-6 max-w-[1400px] mx-auto">
      {/* Header */}
      <div className="flex items-center gap-3 mb-1">
        <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
          <Landmark className="w-5 h-5 text-primary" />
        </div>
        <h1 className="text-2xl font-bold text-foreground tracking-tight">Grant Dashboard</h1>
      </div>
      <p className="text-sm text-muted-foreground mb-8 ml-[52px]">Visual insights into your grant funding and reporting compliance.

      </p>

      {!a.hasData ?
      <div className="border border-dashed border-border rounded-xl py-20 flex flex-col items-center justify-center text-center">
          <div className="w-12 h-12 rounded-xl bg-muted flex items-center justify-center mb-3">
            <Landmark className="w-6 h-6 text-muted-foreground" />
          </div>
          <p className="text-base font-semibold text-foreground mb-1">No grant data yet</p>
          <p className="text-sm text-muted-foreground max-w-sm">
            Add grants in the Grant Register to see funding analytics and compliance insights here.
          </p>
        </div> :

      <>
          {/* KPI cards */}
          <div className="flex flex-wrap gap-4 mb-6">
            <div className="flex-1"><StatCard label="Total Funding" value={formatCurrencyFull(a.totalFunding)} sublabel={`${a.activeCount} Active grants tracked`} icon={DollarSign} tone="blue" /></div>
            <div className="flex-1"><StatCard
            label="Total Reporting Obligations"
            value={a.totalObligations}
            sublabel={`${a.activeCount} Active grants tracked`}
            icon={FileText}
            tone="teal"
            onClick={() => setSummary({ title: 'Total Reporting Obligations', obligations: a.obligationsList })} /></div>

            <div className="flex-1"><StatCard label="Overdue Obligations" value={a.overdueObligations} sublabel="Require immediate attention" icon={AlertTriangle} tone="orange" onClick={() => setSummary({ title: 'Overdue Reports', obligations: a.overdueList })} /></div>

            <div className="flex-1"><StatCard
            label="Compliance"
            value={a.overdueObligations > 0 ? 'At Risk' : 'On Track'}
            isTextValue
            sublabel={a.overdueObligations > 0
              ? `${a.overdueObligations} overdue obligation${a.overdueObligations > 1 ? 's' : ''}`
              : 'No overdue obligations'}
            icon={ShieldCheck}
            tone={a.overdueObligations > 0 ? 'red' : 'green'}
            onClick={a.overdueObligations > 0 ? () => setSummary({ title: 'Compliance — At Risk', obligations: a.overdueList }) : undefined} /></div>
          </div>

          {/* Donut charts row */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
            <GrantDonutChart
              title="Funding by Activity"
              subtitle="Total active grant funding by activity"
              data={activityDonut}
              centerLabel={formatCurrencyFull(a.totalFunding)}
              formatTooltipValue={formatCurrencyFull} />
            <GrantDonutChart
              title="Funding by Provider"
              subtitle="Total active grant funding by funding provider"
              data={providerDonut}
              centerLabel={formatCurrencyFull(a.totalFunding)}
              formatTooltipValue={formatCurrencyFull} />
            <GrantDonutChart
              title="Reporting Obligations by Status"
              subtitle="Total reporting obligations by status"
              data={obligationDonut}
              centerLabel={String(obligationTotal)} />
          </div>

          {/* Charts grid */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
            <FundingByProviderChart data={providerBars} dataKey="label" title="Funding by Provider" subtitle="Top funding sources of active grants by total value" />
            <FundingByProviderChart data={activityBars} dataKey="label" title="Funding by Activity" subtitle="Total active grant value per activity" />
          </div>
        </>
      }

      <ObligationSummaryPane summary={summary} onClose={() => setSummary(null)} />
    </div>);

}