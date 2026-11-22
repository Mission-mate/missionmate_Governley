/**
 * System default membership structures — shared by the client (display/seed
 * metadata) and the ensureMembershipDefaults backend function so the two can
 * never drift.
 */
export const DEFAULT_STRUCTURES = [
  { name: 'Annual Membership', duration_months: 12, is_lifetime: false, is_system_default: true, price: 0, status: 'active' },
  { name: 'Lifetime Membership', duration_months: 0, is_lifetime: true, is_system_default: true, price: 0, status: 'active' },
];