import { base44 } from '@/api/base44Client';

/**
 * Policy document versions. All writes go through the policyVersions server function,
 * which keeps exactly one Current version (the policy's current_version_id) and only
 * points Preview at a new file once the new version is saved and confirmed.
 */
export const VERSION_STATUS_OPTIONS = [{ name: 'Current', color: 'green' }, { name: 'Superseded', color: 'red' }];
export const versionsKey = (policyId) => ['policyVersions', policyId];

export const emptyVersion = () => ({
  version_number: '', display_title: '', summary: '', status: 'Current', approved_by: '', approved_date: '', minute_reference: '', effective_from: '',
});

async function call(payload, fallback) {
  try {
    const { data } = await base44.functions.invoke('policyVersions', payload);
    if (!data?.ok) throw new Error(data?.message || fallback);
    return data;
  } catch (err) {
    throw new Error(err?.response?.data?.message || err?.message || fallback);
  }
}

/** Lists versions (newest first). A policy whose file has no version yet gets exactly one first version. */
export async function listVersions(doc) {
  const data = await call({ action: 'list', policy_id: doc.id }, "Couldn't load versions.");
  return data.versions;
}

/** A new key per add attempt; retries of the same attempt reuse it so no duplicate version is created. */
export const newRequestKey = () => crypto.randomUUID();

/**
 * Creates (`existing` null) or updates a version. `file` replaces the document when given.
 * `upload` caches the uploaded file across retries: { file, file_uri }.
 */
export async function saveVersion(policyId, existing, form, file, requestKey, upload) {
  let filePayload;
  if (file) {
    if (upload.file !== file) {
      const { file_uri } = await base44.integrations.Core.UploadPrivateFile({ file });
      Object.assign(upload, { file, file_uri });
    }
    filePayload = { file_uri: upload.file_uri, file_name: file.name };
  }
  const data = await call({
    action: 'save', policy_id: policyId, version_id: existing?.id, request_key: requestKey, form, file: filePayload,
  }, "Couldn't save the version.");
  return data.versions.find((v) => v.id === data.version_id);
}

/** Only Superseded versions can be deleted; the Current version must be superseded first. */
export async function deleteVersion(v) {
  await call({ action: 'delete', policy_id: v.policy_id, version_id: v.id }, "Couldn't delete the version.");
}