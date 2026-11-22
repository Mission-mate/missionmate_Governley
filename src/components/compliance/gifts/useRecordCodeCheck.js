import { useEffect, useState } from 'react';
import { base44 } from '@/api/base44Client';

/** Debounced, register-scoped uniqueness check for a gift Record ID while typing. */
export default function useRecordCodeCheck(registerId, code, selfId, enabled) {
  const [error, setError] = useState('');
  useEffect(() => {
    const trimmed = (code || '').trim();
    if (!enabled || !trimmed) { setError(''); return; }
    let stale = false;
    const t = setTimeout(async () => {
      const page = await base44.entities.GiftBenefit.filter({ register_id: registerId, record_code: trimmed }, { limit: 2, fields: ['id'] });
      if (!stale) setError((page.items || []).some((d) => d.id !== selfId) ? `Record ID ${trimmed} is already in use.` : '');
    }, 350);
    return () => { stale = true; clearTimeout(t); };
  }, [registerId, code, selfId, enabled]);
  return error;
}