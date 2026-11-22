import React, { useMemo } from 'react';
import { GlowCard } from '@/components/board/conflicts/ConflictSummaryCards';
import { isComplaintOverdue } from '@/lib/complaintRegister';

/** Summary cards for the Complaints Register — same glow-card style as the Conflict of Interest Register. */
export default function ComplaintSummaryCards({ complaints = [] }) {
  const counts = useMemo(() => ({
    total: complaints.length,
    open: complaints.filter((c) => c.status === 'Open').length,
    high: complaints.filter((c) => c.severity === 'High').length,
    overdue: complaints.filter(isComplaintOverdue).length,
  }), [complaints]);

  return (
    <div className="mb-5" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: 16 }}>
      <GlowCard value={counts.total} label="Total Complaints" tone="blue" />
      <GlowCard value={counts.open} label="Open Complaints" tone="amber" />
      <GlowCard value={counts.high} label="Higher Severity Cases" tone="red" />
      <GlowCard value={counts.overdue} label="Overdue Complaints (open 30+ days)" tone="red" />
    </div>
  );
}