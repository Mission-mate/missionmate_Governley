// Risk ID allocation and uniqueness — the server-side source of truth.
// IDs compare case-insensitively and ignore surrounding whitespace.

const MAX_RISKS = 10000;

export const idKey = (v) => String(v ?? '').trim().toLowerCase();

const idNumber = (v) => {
  const n = parseInt(String(v ?? '').replace(/[^0-9]/g, ''), 10);
  return Number.isNaN(n) ? 0 : n;
};

/** Every Risk record (id, risk_id, created_date), oldest first. */
export async function loadRiskIds(sr) {
  const rows = await sr.entities.Risk.list('created_date', MAX_RISKS);
  return (rows || []).map((r) => ({ id: r.id, risk_id: r.risk_id, created_date: r.created_date }));
}

/** Next available ID in the RISK-001 format, skipping every ID already in use. */
export function nextAvailableId(rows, excludeId = null) {
  const taken = new Set(rows.filter((r) => r.id !== excludeId).map((r) => idKey(r.risk_id)).filter(Boolean));
  let n = rows.reduce((max, r) => (r.id === excludeId ? max : Math.max(max, idNumber(r.risk_id))), 0) + 1;
  let candidate = `RISK-${String(n).padStart(3, '0')}`;
  while (taken.has(idKey(candidate))) {
    n += 1;
    candidate = `RISK-${String(n).padStart(3, '0')}`;
  }
  return candidate;
}

/** True when a record other than `excludeId` already uses `riskId`. */
export function isTaken(rows, riskId, excludeId = null) {
  const key = idKey(riskId);
  return !!key && rows.some((r) => r.id !== excludeId && idKey(r.risk_id) === key);
}

/**
 * Records sharing `recordId`'s ID, ordered by who holds it: the oldest record
 * keeps the ID (ties broken by record id), so every writer reaches the same verdict.
 */
export function holdsId(rows, recordId) {
  const mine = rows.find((r) => r.id === recordId);
  if (!mine) return true;
  const holders = rows
    .filter((r) => idKey(r.risk_id) === idKey(mine.risk_id))
    .sort((a, b) => String(a.created_date).localeCompare(String(b.created_date)) || String(a.id).localeCompare(String(b.id)));
  return holders[0].id === recordId;
}

export const duplicateResponse = (riskId) =>
  Response.json({ duplicate: true, field: 'risk_id', error: `Risk ID ${riskId} is already in use.` }, { status: 409 });