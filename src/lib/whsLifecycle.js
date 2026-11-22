// WHS record lifecycle rules: cascade deletes and closing linked actions.
import { base44 } from '@/api/base44Client';
import { format } from 'date-fns';

/** Per-source config: entity, which status counts as "closed", and child cascades. */
export const WHS_SOURCES = {
  hazard: { entity: 'WhsHazard', closed: 'Closed', noun: 'hazard', hasControls: true, objectType: 'whs_hazard' },
  incident: { entity: 'WhsIncident', closed: 'Closed', noun: 'incident', objectType: 'whs_incident' },
  safety_check: { entity: 'WhsSafetyCheck', closed: 'Closed', noun: 'safety check', objectType: 'whs_safety_check' },
};

const actionsOf = (sourceType, sourceId) => ({ source_type: sourceType, source_id: sourceId });

/** Closes every open linked action at the Completed stage; already-closed actions are untouched. */
export async function completeLinkedActions(sourceType, sourceId) {
  const query = { ...actionsOf(sourceType, sourceId), status: { $ne: 'Closed' } };
  const patch = { $set: { status: 'Closed', stage: 'Completed', date_completed: format(new Date(), 'yyyy-MM-dd') } };
  let res;
  do { res = await base44.entities.WhsAction.updateMany(query, patch); } while (res?.has_more);
}

/** Saves a source record and, when the save closes it, completes its linked actions. */
export async function saveWhsSource(sourceType, id, data) {
  const src = WHS_SOURCES[sourceType];
  await base44.entities[src.entity].update(id, data);
  if (data.status === src.closed) await completeLinkedActions(sourceType, id);
}

/** Deletes a source record with its linked actions, notes, documents (and controls for hazards). */
export async function deleteWhsSource(sourceType, id) {
  const src = WHS_SOURCES[sourceType];
  const scope = { object_type: src.objectType, object_id: id };
  await base44.entities.NotePage.deleteMany(scope);
  await base44.entities.Document.deleteMany(scope);
  await base44.entities.WhsAction.deleteMany(actionsOf(sourceType, id));
  if (src.hasControls) await base44.entities.WhsHazardControl.deleteMany({ hazard_id: id });
  if (sourceType === 'incident') await base44.entities.NotePage.deleteMany({ object_type: 'whs_incident_investigation', object_id: id });
  await base44.entities[src.entity].delete(id);
}