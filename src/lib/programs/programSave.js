import { base44 } from '@/api/base44Client';
import { queryClientInstance } from '@/lib/query-client';

/**
 * Save an existing program through the server. A rename returns as soon as the program
 * is saved; linked projects pick up the new title in the background (see TitleSyncStatus).
 */
export async function saveProgram(programId, data) {
  let result;
  try {
    ({ data: result } = await base44.functions.invoke('saveProgram', { program_id: programId, data }));
  } catch (err) {
    throw new Error(err?.response?.data?.error || err?.message || 'Something went wrong');
  }
  if (!result?.ok) throw new Error(result?.error || 'Something went wrong');
  queryClientInstance.invalidateQueries({ queryKey: ['program', programId] });
  return result.program;
}

/** Manually re-run the linked-project title sync for one program. */
export async function retryTitleSync(programId) {
  try {
    await base44.functions.invoke('syncProgramTitles', { program_id: programId });
  } finally {
    refreshAfterTitleSync(programId);
  }
}

export function refreshAfterTitleSync(programId) {
  queryClientInstance.invalidateQueries({ queryKey: ['program', programId] });
  queryClientInstance.invalidateQueries({ queryKey: ['projects', programId] });
  queryClientInstance.invalidateQueries({ queryKey: ['project'] });
}