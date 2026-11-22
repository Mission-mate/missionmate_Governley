// Shared WHS data helpers used by the workspace and record detail pages.
import { base44 } from '@/api/base44Client';
import { nextCode } from '@/lib/whsRegister';

/** Next sequential human ID for an entity within a register, e.g. INC-004. */
export async function nextRecordCode(entityName, codeField, prefix, registerId) {
  const { items } = await base44.entities[entityName].filter({ register_id: registerId }, { distinct: codeField, limit: 1000 });
  return nextCode(prefix, items);
}

/** Keep only the defined form fields (blanks become null). */
export const pickFields = (fields, draft) => Object.fromEntries(fields.map((f) => [f.key, draft[f.key] ?? null]));

/** Query keys that every WHS register view depends on. */
export const invalidateWhsRegister = (qc) =>
  ['whsList', 'whsTiles', 'whsStatusCounts'].forEach((k) => qc.invalidateQueries({ queryKey: [k] }));