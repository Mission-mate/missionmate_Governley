// Customisation for the Details of Responsible People register: Committee options + custom columns.
import { base44 } from '@/api/base44Client';
import { getAssetCustomColumns } from '@/lib/assetRegister';
import { cleanupAssetCustomFields } from '@/lib/assetRegisterApi';
import { toNameList } from '@/lib/configNormalize';
import { toDraftOptions, diffSystemOptions } from '@/lib/whsCustomise';

export const DEFAULT_COMMITTEES = ['Board', 'Risk & Audit Committee'];
const BOARD = 'Board';
const SYSTEM = [{ key: 'committees', field: 'committee', label: 'Committee', locked: [BOARD] }];
const DEF = { noun: 'committee member', columnsKey: 'custom_columns', system: SYSTEM };

// 'Board' is a permanent option — always present and first.
export const rpCommittees = (register) => {
  const names = toNameList(register?.config?.committees, DEFAULT_COMMITTEES);
  return [BOARD, ...names.filter((n) => n !== BOARD)];
};
export const rpCustomColumns = (register) => getAssetCustomColumns(register, DEF.columnsKey);

const People = () => base44.entities.ResponsiblePerson;
const listPeople = (registerId) => People().filter({ register_id: registerId }, '-created_date', 5000);

export const rpAdapter = {
  def: DEF,
  initialDraft: (register) => ({ custom: rpCustomColumns(register), committees: toDraftOptions(rpCommittees(register)) }),
  diff: (baseline, draft) => diffSystemOptions(SYSTEM, baseline, draft),
  async countInUse(register, [d]) {
    if (!d.removed.length) return [];
    const people = await listPeople(register.id);
    const count = people.filter((p) => (p.offices || []).some((o) => d.removed.includes(o.committee))).length;
    return count ? [{ label: d.label, count }] : [];
  },
  async save(register, [d], custom) {
    if (d.removed.length || d.renames.length) {
      const renameMap = Object.fromEntries(d.renames.map((r) => [r.from, r.to]));
      const updates = [];
      (await listPeople(register.id)).forEach((p) => {
        let changed = false;
        const offices = (p.offices || []).map((o) => {
          if (d.removed.includes(o.committee)) { changed = true; const { committee, ...rest } = o; return rest; } // eslint-disable-line no-unused-vars
          if (renameMap[o.committee]) { changed = true; return { ...o, committee: renameMap[o.committee] }; }
          return o;
        });
        if (changed) updates.push({ id: p.id, offices });
      });
      for (let i = 0; i < updates.length; i += 500) await People().bulkUpdate(updates.slice(i, i + 500));
    }
    await cleanupAssetCustomFields(register.id, rpCustomColumns(register), custom, People());
    await base44.entities.ComplianceManagedRegister.update(register.id, {
      config: { ...(register.config || {}), committees: d.names, [DEF.columnsKey]: custom },
    });
  },
};