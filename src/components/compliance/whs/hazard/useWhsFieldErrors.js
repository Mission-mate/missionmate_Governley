import { useEffect, useState } from 'react';
import { base44 } from '@/api/base44Client';

/**
 * Inline WHS field errors: required messages (once `showRequired`) plus a live
 * duplicate check for the field flagged `unique: '<Entity>'`, scoped to the register.
 */
export default function useWhsFieldErrors(fields, draft, selfId, showRequired) {
  const codeField = fields.find((f) => f.unique);
  const code = codeField ? String(draft[codeField.key] ?? '').trim() : '';
  const registerId = draft.register_id;
  const [taken, setTaken] = useState(false);

  useEffect(() => {
    setTaken(false);
    if (!codeField || !code || !registerId) return undefined;
    let live = true;
    const t = setTimeout(async () => {
      const n = await base44.entities[codeField.unique].count({
        register_id: registerId, [codeField.key]: code, ...(selfId ? { id: { $ne: selfId } } : {}),
      });
      if (live) setTaken(n > 0);
    }, 300);
    return () => { live = false; clearTimeout(t); };
  }, [codeField?.key, codeField?.unique, code, registerId, selfId]);

  const errors = {};
  if (showRequired) {
    fields.forEach((f) => { if (f.required && !String(draft[f.key] ?? '').trim()) errors[f.key] = `${f.label} is required.`; });
  }
  if (taken && codeField) errors[codeField.key] = `${codeField.label} "${code}" is already in use.`;
  const missing = fields.some((f) => f.required && !String(draft[f.key] ?? '').trim());
  return { errors, blocked: missing || taken };
}