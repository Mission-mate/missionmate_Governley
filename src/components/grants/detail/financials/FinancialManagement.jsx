import React, { useMemo } from 'react';
import { useFinancials } from '@/components/grants/detail/financials/useFinancials';
import FundingScheduleTable from '@/components/grants/detail/financials/FundingScheduleTable';
import ModuleLoader from '@/components/shared/states/ModuleLoader';
import LoadError from '@/components/shared/states/LoadError';

/**
 * Financial Management for a grant — the Funding Schedule.
 * Funding ops go through the funding-specific handlers, the only path that
 * recalculates Grant.total_amount.
 */
export default function FinancialManagement({ parentId }) {
  const { entries, isLoading, failure, addFundingRow, updateFundingRow, deleteFundingRow, isFundingSaving } = useFinancials('grant', parentId);
  const fundingRows = useMemo(() => entries.filter(e => e.type === 'funding'), [entries]);

  return (
    <div>
      <div className="mb-5">
        <h2 className="text-2xl font-bold text-foreground">Financial Management</h2>
        <p className="text-sm text-muted-foreground mt-0.5">Track funding and payments.</p>
      </div>

      {isLoading ? (
        <div className="border border-border rounded-2xl bg-white dark:bg-card overflow-hidden"><ModuleLoader /></div>
      ) : failure.isLoadingError ? (
        <LoadError failure={failure} title="Couldn’t load financials" />
      ) : (
        <FundingScheduleTable
          rows={fundingRows}
          onAdd={addFundingRow}
          onUpdate={updateFundingRow}
          onDelete={deleteFundingRow}
          saving={isFundingSaving}
        />
      )}
    </div>
  );
}