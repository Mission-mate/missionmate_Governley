import { createContext, useContext } from 'react';
import { base44 } from '@/api/base44Client';

/**
 * Scope for the shared Conflict of Interest register UI.
 * Board (default): registerId null, people come from the committee member register.
 * Compliance: registerId set, people are register-scoped CoiPerson declarants and
 * conflicts are filtered by register_id. `declarant` ({ user_id, name }) is set inside
 * a declarant's profile, scoping the table to that person's declarations.
 */
export const BOARD_SCOPE = { registerId: null, personLabel: 'Member' };
export const ConflictScopeContext = createContext(BOARD_SCOPE);
export const useConflictScope = () => useContext(ConflictScopeContext);

/** Register declarants — full CoiPerson records plus the shape the person search expects. */
export async function listScopePeople(registerId) {
  const rows = await base44.entities.CoiPerson.filter({ register_id: registerId }, 'full_name', 1000);
  return rows.map((p) => ({
    ...p, user_id: p.id, member_name: p.full_name,
    role: p.role || '', division: p.division || '', email: p.email || '',
  }));
}

/** Fill a selected person with their stored profile details. */
export function withProfile(member, people = []) {
  if (!member?.user_id || member.dirty) return member;
  const p = people.find((x) => x.user_id === member.user_id);
  return p ? { ...member, role: p.role, division: p.division, email: p.email } : member;
}

/** A person is complete once Name and Role are filled. */
export const isPersonComplete = (m) => !!m?.name?.trim() && !!m?.role?.trim();