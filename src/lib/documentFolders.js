import { base44 } from '@/api/base44Client';

// Entity names are injectable so a module (e.g. Planner) keeps its documents fully isolated.
export const DEFAULT_DOC_ENTITIES = { document: 'Document', folder: 'DocumentFolder' };

/**
 * Number of folder rows a record's Documents tab lists: its folders, plus the
 * virtual Unsorted folder when any document sits outside them.
 */
export async function countFolderRows(scope, entities = DEFAULT_DOC_ENTITIES) {
  const folders = await base44.entities[entities.folder].filter(scope);
  const loose = await base44.entities[entities.document].count({ ...scope, folder_id: { $nin: folders.map((f) => f.id) } });
  return folders.length + (loose > 0 ? 1 : 0);
}

/** A folder's "Last updated" date: its most recently changed document, else the folder's own. */
export function folderLastUpdated(folder, docs) {
  return docs.map((d) => d.updated_date || d.created_date || '').sort().pop() || folder.updated_date || '';
}