import React, { useMemo } from 'react';
import { GlowCard } from '@/components/board/conflicts/ConflictSummaryCards';
import { summaryCounts } from '@/lib/workforceRegister';

/** Shared summary cards for the Workforce and Credentials tabs — archived records excluded. */
export default function WorkforceSummaryCards({ people, credentials }) {
  const c = useMemo(() => summaryCounts(people, credentials), [people, credentials]);
  return (
    <div className="mb-5" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: 16 }}>
      <GlowCard value={c.people} label="Total People" tone="blue" />
      <GlowCard value={c.credentials} label="Total Credentials" tone="green" />
      <GlowCard value={c.expired} label="Expired Credentials" tone="red" />
      <GlowCard value={c.pending} label="Pending Verification" tone="amber" />
    </div>
  );
}