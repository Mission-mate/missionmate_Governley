/**
 * storageResolveUrl — returns a short-lived signed URL for the file stored on
 * a document record. The file is looked up from the record, so a link can only
 * be created for a file that belongs to an existing document.
 * Params: { documentId: string, entity?: 'Document' | 'PlannerTaskDocument' }
 * Returns { signed_url: string }
 */
import { createClientFromRequest, serve } from '../_shared/base44.ts';

const DOCUMENT_ENTITIES = ['Document', 'PlannerTaskDocument'];

export default async function handler(req) {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me().catch((e) => (e.status === 401 ? null : Promise.reject(e)));
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });

    const { documentId, entity = 'Document' } = await req.json().catch(() => ({}));
    if (!documentId || !DOCUMENT_ENTITIES.includes(entity)) {
      return Response.json({ error: 'A valid documentId and entity are required' }, { status: 400 });
    }

    const doc = await base44.entities[entity].get(documentId)
      .catch((e) => (e.status === 404 ? null : Promise.reject(e)));
    if (!doc) return Response.json({ error: 'Document not found' }, { status: 404 });
    if (!doc.file_url || /^https?:/i.test(doc.file_url)) {
      return Response.json({ error: 'This document has no stored file' }, { status: 404 });
    }

    const result = await base44.asServiceRole.integrations.Core.CreateFileSignedUrl({
      file_uri: doc.file_url,
      expires_in: 300,
    });
    return Response.json({ signed_url: result.signed_url });
  } catch (error) {
    console.error('storageResolveUrl failed', error);
    return Response.json({ error: 'Could not create a link for this file' }, { status: 500 });
  }
}

serve(handler);
