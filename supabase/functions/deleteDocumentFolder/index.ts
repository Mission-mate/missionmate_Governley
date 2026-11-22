import { createClientFromRequest, serve } from '../_shared/base44.ts';
import { purge, deleteParent, cleanIds } from '../_shared/cascadeKit.ts';

// Each folder entity and the document entity whose records live inside it.
const DOCUMENTS_OF = {
  DocumentFolder: 'Document',
  PlannerTaskDocumentFolder: 'PlannerTaskDocument',
};

/**
 * Permanently delete a folder together with every document inside it.
 * The documents are removed first and re-counted; the folder is deleted only
 * once none remain, so a failed run leaves the folder in place for a safe retry.
 * Params: { folderId: string, entity?: 'DocumentFolder' | 'PlannerTaskDocumentFolder' }
 * Returns { ok: true, documents: number }.
 */
export default async function handler(req: Request): Promise<Response> {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me().catch((e) => (e.status === 401 ? null : Promise.reject(e)));
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });

    const body = await req.json().catch(() => ({}));
    const entity = body?.entity || 'DocumentFolder';
    const [folderId] = cleanIds([body?.folderId]);
    if (!folderId || !DOCUMENTS_OF[entity]) {
      return Response.json({ error: 'A valid folderId and entity are required' }, { status: 400 });
    }

    const svc = base44.entities;
    const documents = await purge(svc, DOCUMENTS_OF[entity], { folder_id: folderId });
    await deleteParent(svc, entity, folderId);
    return Response.json({ ok: true, documents });
  } catch (error) {
    console.error('deleteDocumentFolder failed', error);
    return Response.json({ ok: false, error: error.message }, { status: 500 });
  }
}

serve(handler);
