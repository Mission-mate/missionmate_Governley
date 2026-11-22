import { useMemo } from 'react';
import { parseISO, format, isPast, isToday, differenceInCalendarDays } from 'date-fns';
import { useGrants, useReportingObligations, useGrantProviders, useGrantActivities } from '@/hooks/useGrantQueries';
import { loadFailure } from '@/lib/readState';
import { useLocalToday } from '@/components/LocalDayProvider';

/**
 * Groups active grants' funding by their lookup ID — never by the cached name.
 *
 * Grouping by the cached display name is what used to split one provider across
 * two bars after a rename, and merge two same-named providers into one. The ID is
 * the authoritative link, so the group key is the ID and the label is resolved
 * from the canonical lookup record. Grants with no ID link fall back to their
 * cached name and are marked as unlinked so the gap is visible, not hidden.
 */
function groupFundingByLookup(activeGrants, records, idField, nameField, unassignedLabel) {
  const recordsById = new Map(records.map((r) => [r.id, r]));
  const groups = new Map();

  activeGrants.forEach((g) => {
    const linkedId = g[idField];
    const rec = linkedId ? recordsById.get(linkedId) : null;
    const key = rec ? rec.id : `unlinked:${(g[nameField] || '').trim().toLowerCase()}`;
    const label = rec ? rec.name : (g[nameField] || '').trim() || unassignedLabel;

    const existing = groups.get(key) || { id: rec ? rec.id : '', label, amount: 0, unlinked: !rec };
    existing.amount += Number(g.total_amount) || 0;
    groups.set(key, existing);
  });

  return Array.from(groups.values())
    .sort((a, b) => b.amount - a.amount)
    .slice(0, 6);
}

// An obligation is overdue when it's past its due date and not complete.
function isObligationOverdue(o) {
  if (o.status === 'complete') return false;
  if (!o.due_date) return false;
  const due = parseISO(o.due_date);
  return isPast(due) && !isToday(due);
}

// Mirrors the Grant.status enum exactly — no other status can exist.
const STATUS_ORDER = ['active', 'closed', 'archived'];
const OBLIGATION_ORDER = ['not_started', 'in_progress', 'complete'];

// Aggregates Grant + ReportingObligation data into the metrics rendered by the dashboard.
export function useGrantAnalytics() {
  const { data: grants = [], isLoading: grantsLoading, ...grantsRead } = useGrants();
  const { data: obligations = [], isLoading: obligationsLoading, ...obligationsRead } = useReportingObligations();
  const { data: providers = [], isLoading: providersLoading, ...providersRead } = useGrantProviders();
  const { data: activities = [], isLoading: activitiesLoading, ...activitiesRead } = useGrantActivities();

  const day = useLocalToday();
  const analytics = useMemo(() => {
    const totalGrants = grants.length;
    // Total funding is scoped to active grants only.
    const activeGrants = grants.filter((g) => g.status === 'active');
    const activeGrantIds = new Set(activeGrants.map((g) => g.id));
    const totalFunding = activeGrants.reduce((sum, g) => sum + (Number(g.total_amount) || 0), 0);

    // Funding/count by status
    const statusMap = {};
    STATUS_ORDER.forEach((s) => { statusMap[s] = { status: s, count: 0, amount: 0 }; });
    grants.forEach((g) => {
      const s = g.status || 'active';
      if (!statusMap[s]) statusMap[s] = { status: s, count: 0, amount: 0 };
      statusMap[s].count += 1;
      statusMap[s].amount += Number(g.total_amount) || 0;
    });
    const byStatus = STATUS_ORDER.map((s) => statusMap[s]).filter(Boolean);

    const activeFunding = statusMap.active?.amount || 0;
    const closedFunding = statusMap.closed?.amount || 0;
    const activeCount = activeGrants.length;

    // Funding by provider / activity (top 6) — grouped by ID, labelled from the lookup.
    const byProvider = groupFundingByLookup(activeGrants, providers, 'provider_id', 'provider', 'Unknown');
    const byProgram = groupFundingByLookup(activeGrants, activities, 'activity_id', 'program', 'Unassigned');

    // All obligation metrics on the dashboard are scoped to active grants only —
    // obligations in closed/archived grants are excluded.
    const activeGrantObligations = obligations.filter((o) => activeGrantIds.has(o.grant_id));

    // Obligation status breakdown (active grants only)
    const obStatusMap = {};
    OBLIGATION_ORDER.forEach((s) => { obStatusMap[s] = 0; });
    activeGrantObligations.forEach((o) => {
      const s = o.status || 'not_started';
      obStatusMap[s] = (obStatusMap[s] || 0) + 1;
    });
    const obligationStatus = OBLIGATION_ORDER.map((s) => ({ status: s, count: obStatusMap[s] || 0 }));

    const totalObligations = activeGrantObligations.length;
    const completedObligations = activeGrantObligations.filter((o) => o.status === 'complete').length;
    const overdueObligations = activeGrantObligations.filter(isObligationOverdue).length;
    const complianceRate = totalObligations ? Math.round((completedObligations / totalObligations) * 100) : 0;

    // Grant lookup for enriching obligations with grant title + provider
    const grantById = {};
    grants.forEach((g) => { grantById[g.id] = g; });

    // Upcoming obligations — exclude completed (not upcoming) and archived
    const today = new Date();
    const upcomingAll = activeGrantObligations
      .filter((o) => o.status !== 'complete' && o.due_date)
      .map((o) => {
        const g = grantById[o.grant_id] || {};
        return {
          ...o,
          daysUntil: differenceInCalendarDays(parseISO(o.due_date), today),
          grant_title: g.name || '—',
          provider: g.provider || '—',
        };
      })
      .sort((a, b) => a.daysUntil - b.daysUntil);

    const dueWithin30List = upcomingAll.filter((o) => o.daysUntil >= 0 && o.daysUntil <= 30);
    const dueWithin30Count = dueWithin30List.length;
    const obligationsList = activeGrantObligations.map((o) => {
      const g = grantById[o.grant_id] || {};
      return { ...o, grant_title: g.name || '—' };
    });
    const overdueList = activeGrantObligations
      .map((o) => ({ ...o, grant_title: (grantById[o.grant_id] || {}).name || '—' }))
      .filter(isObligationOverdue);
    // Dashboard list: obligations due in the next 90 days, plus anything overdue.
    const upcoming = upcomingAll.filter((o) => o.daysUntil <= 90).slice(0, 5);

    return {
      totalGrants,
      totalFunding,
      activeFunding,
      closedFunding,
      activeCount,
      byStatus,
      byProvider,
      byProgram,
      obligationStatus,
      completedObligations,
      overdueObligations,
      totalObligations,
      complianceRate,
      upcoming,
      dueWithin30Count,
      dueWithin30List,
      obligationsList,
      overdueList,
    };
  }, [grants, obligations, providers, activities, day]);

  return {
    ...analytics,
    isLoading: grantsLoading || obligationsLoading || providersLoading || activitiesLoading,
    failure: loadFailure(grantsRead, obligationsRead, providersRead, activitiesRead),
    hasData: grants.length > 0,
  };
}

// Full dollar amount with comma separators, no decimals (e.g. $400,000)
export const formatCurrencyFull = (n) => `$${Math.round(Number(n) || 0).toLocaleString()}`;

export const formatCurrency = (n) => {
  const num = Number(n) || 0;
  if (Math.abs(num) >= 1_000_000) return `$${Math.round(num / 1_000_000)}M`;
  if (Math.abs(num) >= 1_000) return `$${Math.round(num / 1_000)}K`;
  return `$${num.toLocaleString()}`;
};

export const formatDate = (d) => {
  try { return format(parseISO(d), 'd MMM yyyy'); } catch { return d; }
};