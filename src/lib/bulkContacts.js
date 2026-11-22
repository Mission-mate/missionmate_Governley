import { base44 } from '@/api/base44Client';

/**
 * Thin client wrappers around the processBulkContactUpdate backend function.
 * All bulk Contact operations route through this single function.
 */

export async function bulkUploadContacts(records) {
  const res = await base44.functions.invoke('processBulkContactUpdate', {
    operation: 'upload',
    records,
  });
  return res.data;
}

export async function bulkDeleteContacts(ids) {
  const res = await base44.functions.invoke('processBulkContactUpdate', {
    operation: 'delete',
    ids,
  });
  return res.data;
}