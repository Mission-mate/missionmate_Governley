import { useEffect } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';

/**
 * Canonical grant / reporting-obligation list queries.
 *
 * Every page that needs "all grants" or "all reporting obligations" MUST use
 * these hooks. Owning the queryKey and the queryFn in one place is what stops
 * them drifting apart: React Query dedupes by key only, so two call sites
 * sharing a key but using different sort/limit params would silently serve each
 * other's data depending on which mounted first.
 *
 * Safety limits are intentionally generous (organisations are not expected to
 * exceed them) so KPIs and charts are never quietly computed on a partial set.
 */
export const GRANTS_QUERY_KEY = ['grants'];
export const REPORTING_OBLIGATIONS_QUERY_KEY = ['reportingObligations'];

const GRANTS_LIMIT = 1000;
const OBLIGATIONS_LIMIT = 2000;

export function useGrants() {
  const qc = useQueryClient();

  // Central realtime freshness for every grants consumer. A grant changing
  // status (e.g. active -> archived) touches no obligation record, so without
  // this the Reporting Obligations monitored set would stay stale until a
  // manual refetch. Invalidate-only: React Query dedupes by key, so one
  // refetch fires per change no matter how many consumers are mounted.
  useEffect(() => {
    const unsubscribe = base44.entities.Grant.subscribe(() => {
      qc.invalidateQueries({ queryKey: GRANTS_QUERY_KEY });
    });
    return unsubscribe;
  }, [qc]);

  return useQuery({
    queryKey: GRANTS_QUERY_KEY,
    queryFn: () => base44.entities.Grant.list('-created_date', GRANTS_LIMIT),
  });
}

/**
 * Canonical lookup queries. The key is the bare entity name so GrantFieldCombobox
 * and the dashboard analytics share one cache entry — a rename invalidated in one
 * place refreshes the other.
 */
export function useGrantProviders() {
  return useQuery({
    queryKey: ['GrantProvider'],
    queryFn: () => base44.entities.GrantProvider.list(),
  });
}

export function useGrantActivities() {
  return useQuery({
    queryKey: ['GrantActivity'],
    queryFn: () => base44.entities.GrantActivity.list(),
  });
}

export function useReportingObligations() {
  return useQuery({
    queryKey: REPORTING_OBLIGATIONS_QUERY_KEY,
    queryFn: () => base44.entities.ReportingObligation.list('-created_date', OBLIGATIONS_LIMIT),
  });
}