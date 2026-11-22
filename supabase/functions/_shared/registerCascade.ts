/**
 * Shared cascade for removing a Compliance register (ComplianceManagedRegister)
 * together with every record it owns.
 *
 * Ownership map — every top-level collection is scoped by register_id, and each
 * child is reached from the actual ids of its parent:
 *   asset                 AssetRegisterItem ─ AssetMaintenanceEntry { asset_id }
 *   information_asset     InformationAsset
 *   donor                 Donor ─ Donation { donor_id }
 *   responsible_people    ResponsiblePerson
 *   gifts_hospitality     GiftBenefit
 *   complaints            Complaint ─ ComplaintAction { complaint_id }
 *   contracts             Contract ─ ContractObligation / ContractVariation { contract_id }
 *   conflict_of_interest  ConflictOfInterest ─ ConflictAction { conflict_id }, then CoiPerson
 *   police_check          WorkforcePerson ─ WorkforceCredential { person_id }
 *   whs                   WhsHazard ─ WhsHazardControl { hazard_id }, WhsIncident,
 *                         WhsSafetyCheck, WhsAction
 * Notes, documents and folders attached to a record (object_type + object_id) go with it.
 *
 * Every collection is swept for every register, whatever its type: a query that
 * only matches this register's id can never touch another register's records, and
 * it also clears children left behind by an earlier, interrupted delete.
 * Children go before parents and the register itself is deleted last, only once
 * everything it owns is verified gone. Each step is idempotent, so a failed run
 * can simply be repeated.
 */
import { CascadeError, withRetry, purge, purgeAttached, drain, deleteParent, add, type Tally } from './cascadeKit.ts';

type Node = { entity: string; key: string; attached?: string[]; children?: Node[] };

const BY_REGISTER = 'register_id';

const OWNED: Node[] = [
  { entity: 'AssetRegisterItem', key: BY_REGISTER, attached: ['compliance_asset'], children: [{ entity: 'AssetMaintenanceEntry', key: 'asset_id' }] },
  { entity: 'AssetMaintenanceEntry', key: BY_REGISTER },
  { entity: 'InformationAsset', key: BY_REGISTER, attached: ['information_asset'] },
  { entity: 'Donor', key: BY_REGISTER, children: [{ entity: 'Donation', key: 'donor_id' }] },
  { entity: 'Donation', key: BY_REGISTER },
  { entity: 'ResponsiblePerson', key: BY_REGISTER, attached: ['responsible_person'] },
  { entity: 'GiftBenefit', key: BY_REGISTER, attached: ['gift_benefit'] },
  { entity: 'Complaint', key: BY_REGISTER, attached: ['complaint'], children: [{ entity: 'ComplaintAction', key: 'complaint_id' }] },
  { entity: 'ComplaintAction', key: BY_REGISTER },
  {
    entity: 'Contract', key: BY_REGISTER, attached: ['contract'], children: [
      { entity: 'ContractObligation', key: 'contract_id', attached: ['contract_obligation'] },
      { entity: 'ContractVariation', key: 'contract_id', attached: ['contract_variation'] },
    ],
  },
  { entity: 'ContractObligation', key: BY_REGISTER, attached: ['contract_obligation'] },
  { entity: 'ContractVariation', key: BY_REGISTER, attached: ['contract_variation'] },
  { entity: 'ConflictOfInterest', key: BY_REGISTER, attached: ['conflict_of_interest', 'conflict_action'], children: [{ entity: 'ConflictAction', key: 'conflict_id' }] },
  { entity: 'CoiPerson', key: BY_REGISTER },
  { entity: 'WorkforcePerson', key: BY_REGISTER, children: [{ entity: 'WorkforceCredential', key: 'person_id' }] },
  { entity: 'WorkforceCredential', key: BY_REGISTER },
  { entity: 'WhsAction', key: BY_REGISTER },
  { entity: 'WhsHazard', key: BY_REGISTER, attached: ['whs_hazard'], children: [{ entity: 'WhsHazardControl', key: 'hazard_id' }] },
  { entity: 'WhsHazardControl', key: BY_REGISTER },
  { entity: 'WhsIncident', key: BY_REGISTER, attached: ['whs_incident', 'whs_incident_investigation'] },
  { entity: 'WhsSafetyCheck', key: BY_REGISTER, attached: ['whs_safety_check'] },
];

/** Remove every record matching `query`: its children and attachments first, then the records. */
async function clearNode(svc: any, node: Node, query: Record<string, unknown>, tally: Tally) {
  await drain(svc, node.entity, query, async (ids) => {
    for (const child of node.children || []) await clearNode(svc, child, { [child.key]: { $in: ids } }, tally);
    for (const objectType of node.attached || []) await purgeAttached(svc, tally, objectType, ids);
    add(tally, node.entity, await purge(svc, node.entity, { id: { $in: ids } }));
  });
}

/** Register record types that can be deleted on their own, with everything they own. */
export const RECORD_ENTITIES = ['AssetRegisterItem', 'ResponsiblePerson'];

/**
 * Remove one register record with its children and attachments, the record itself last.
 * Every query is scoped to this record's id, so nothing belonging to another record is touched.
 */
export async function cascadeDeleteRecord(svc: any, entity: string, id: string, tally: Tally = {}): Promise<Tally> {
  const node = OWNED.find((n) => n.entity === entity && RECORD_ENTITIES.includes(entity));
  if (!node) throw new CascadeError(entity, new Error('unsupported record type'));
  await clearNode(svc, node, { id }, tally);
  return tally;
}

export async function cascadeDeleteRegister(svc: any, registerId: string, tally: Tally = {}): Promise<Tally> {
  for (const node of OWNED) await clearNode(svc, node, { [BY_REGISTER]: registerId }, tally);
  await deleteParent(svc, 'ComplianceManagedRegister', registerId);
  const left = await withRetry('ComplianceManagedRegister', () => svc.ComplianceManagedRegister.count({ id: registerId }));
  if (left > 0) throw new CascadeError('ComplianceManagedRegister', new Error('the register is still present'));
  add(tally, 'ComplianceManagedRegister', 1);
  return tally;
}