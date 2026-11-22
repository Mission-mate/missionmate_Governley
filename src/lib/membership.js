import { base44 } from '@/api/base44Client';
import { calcExpirationDate } from '@/lib/membershipExpiration';

export const MEMBER_STATUSES = [
  { value: 'active', label: 'Active' },
  { value: 'pending', label: 'Pending' },
  { value: 'expired', label: 'Expired' },
];

/**
 * Calculate the expiration date for a member given a start date and the
 * selected membership structure. Lifetime structures return '' (never expires).
 *
 * Thin wrapper over the canonical shared implementation, which the public-form
 * backend function uses too — so the two can never drift again.
 */
export const calculateExpirationDate = calcExpirationDate;

// Runs the seeding check at most once per browser session.
let defaultsPromise = null;

/**
 * Ensure the system default membership plans exist. The whole check-create-dedupe
 * cycle runs server-side (ensureMembershipDefaults) so concurrent sessions cannot
 * create duplicates. Resolves to the function result; rejects on failure so the
 * caller can surface it.
 */
export function ensureDefaultStructures() {
  if (!defaultsPromise) {
    defaultsPromise = base44.functions
      .invoke('ensureMembershipDefaults', {})
      .then((res) => res.data)
      .catch((error) => {
        // Allow a later attempt to retry rather than caching the failure.
        defaultsPromise = null;
        throw error;
      });
  }
  return defaultsPromise;
}

/**
 * Cascade a plan/tier rename onto the cached names carried by its members.
 * Silent on success; the caller decides whether to surface a failure.
 */
export function syncMemberPlanNames(structureId) {
  return base44.functions.invoke('syncMemberPlanNames', { structureId });
}