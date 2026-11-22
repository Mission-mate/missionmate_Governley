import { base44 } from '@/api/base44Client';

export const RECORD_TYPE_OPTIONS = [{ name: 'Digital', color: 'blue' }, { name: 'Hardcopy', color: 'orange' }, { name: 'Hybrid', color: 'purple' }];
export const INFO_STATUS_OPTIONS = [{ name: 'Active', color: 'green' }, { name: 'Superseded', color: 'red' }];
export const YES_NO_OPTIONS = [{ name: 'Yes', color: 'red' }, { name: 'No', color: 'green' }];

export const INFO_FILTER_FIELDS = [
  { id: 'record_type', label: 'Record Type', values: RECORD_TYPE_OPTIONS.map((o) => o.name) },
  { id: 'personal_information', label: 'Personal Information', values: ['Yes', 'No'] },
  { id: 'national_security', label: 'National Security Information', values: ['Yes', 'No'] },
];

export const emptyInfoAsset = () => ({
  title: '', description: '', record_type: '', status: 'Active', location: '', personal_information: '', national_security: '',
  business_function: '', information_owner: '', retention_requirement: '',
  security_classification: '', confidentiality_impact: '', integrity_impact: '', availability_impact: '',
  risk_exposure: '', risk_details: '', custom_fields: {},
});

export const SECURITY_CLASSIFICATION_OPTIONS = [{ name: 'Public', color: 'green' }, { name: 'Internal', color: 'blue' }, { name: 'Confidential', color: 'red' }];
export const IMPACT_OPTIONS = [
  { name: 'No Impact', dot: 'bg-green-400' }, { name: 'Minor', dot: 'bg-green-700' }, { name: 'Limited', dot: 'bg-amber-400' },
  { name: 'Major', dot: 'bg-red-300' }, { name: 'Catastrophic', dot: 'bg-red-600' },
];
export const RISK_EXPOSURE_OPTIONS = [{ name: 'Low', color: 'blue' }, { name: 'Medium', color: 'orange' }, { name: 'High', color: 'red' }];

export const pickInfoAsset = (a) => ({
  ...Object.fromEntries(Object.keys(emptyInfoAsset()).map((k) => [k, a?.[k] ?? ''])),
  custom_fields: a?.custom_fields || {},
});

export const listInfoAssets = (registerId) => base44.entities.InformationAsset.filter({ register_id: registerId }, '-created_date', 1000);
export const createInfoAsset = (registerId, data) => base44.entities.InformationAsset.create({ ...data, register_id: registerId });
export const updateInfoAsset = (id, data) => base44.entities.InformationAsset.update(id, data);
export const setInfoAssetsStatus = (ids, status) => base44.entities.InformationAsset.updateMany({ id: { $in: ids } }, { $set: { status } });
export const INFO_ASSET_OBJECT_TYPE = 'information_asset';
export const deleteInfoAssets = async (ids) => {
  await base44.entities.NotePage.deleteMany({ object_type: INFO_ASSET_OBJECT_TYPE, object_id: { $in: ids } });
  return base44.entities.InformationAsset.deleteMany({ id: { $in: ids } });
};
export const INFO_BULK_STATUS_OPTIONS = [{ name: 'Active', dot: 'bg-green-500' }, { name: 'Superseded', dot: 'bg-red-500' }];

export function filterInfoAssets(items, { status, search, filters }) {
  const q = search.trim().toLowerCase();
  return items.filter((a) =>
    (status === 'All' || a.status === status) &&
    (!q || [a.title, a.description, a.location].some((v) => (v || '').toLowerCase().includes(q))) &&
    Object.entries(filters).every(([k, v]) => a[k] === v));
}