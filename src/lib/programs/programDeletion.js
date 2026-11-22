import { base44 } from '@/api/base44Client';

/**
 * Program / Project deletion runs as a verified server-side cascade. Each parent is
 * removed only after all of its records are gone; a failed parent stays for a safe retry.
 * Both resolve to { ok, deleted, failed: [{ id, title, stage, error }], missing }.
 */
export async function deletePrograms(programIds) {
  const { data } = await base44.functions.invoke('deletePrograms', { program_ids: programIds });
  return data;
}

export async function deleteProjects(programId, projectIds) {
  const { data } = await base44.functions.invoke('deleteProjects', { program_id: programId, project_ids: projectIds });
  return data;
}