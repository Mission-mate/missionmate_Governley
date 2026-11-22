import { useEffect, useRef } from 'react';
import { base44 } from '@/api/base44Client';
import { useQueryClient } from '@tanstack/react-query';

// Mandatory system committees seeded on first load of the board module.
const DEFAULT_COMMITTEES = [
  { name: 'General Board Meeting', description: 'Full board meetings for all directors.' },
  { name: 'Finance, Audit and Risk Committee', description: 'Oversight of finance, audit and risk matters.' },
  { name: 'Project Meeting', description: 'Meetings focused on specific projects.' },
  { name: 'Ad Hoc Meeting', description: 'Ad hoc meetings convened as needed.' },
];

let initPromise = null;

async function ensureDefaultCommittees() {
  const existing = await base44.entities.Committee.list();
  const existingNames = new Set(existing.map(c => (c.name || '').trim().toLowerCase()));
  const missing = DEFAULT_COMMITTEES.filter(
    c => !existingNames.has(c.name.trim().toLowerCase())
  );
  if (missing.length > 0) {
    await base44.entities.Committee.bulkCreate(
      missing.map(c => ({ ...c, status: 'active' }))
    );
    return true;
  }
  return false;
}

/**
 * Idempotent board module initialiser. Seeds mandatory system committees
 * exactly once per session. Safe to call from multiple components.
 */
export function useBoardInit() {
  const qc = useQueryClient();
  const ran = useRef(false);

  useEffect(() => {
    if (ran.current) return;
    ran.current = true;

    if (!initPromise) {
      initPromise = ensureDefaultCommittees().catch(() => false);
    }
    initPromise.then(created => {
      if (created) qc.invalidateQueries({ queryKey: ['committees'] });
    });
  }, [qc]);
}