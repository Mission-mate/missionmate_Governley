/** Internal private storage for the shared document management system. */
import { base44 } from '@/api/base44Client';
import { toast } from '@/components/ui/use-toast';
import { validateUploadFile } from '@/lib/uploadValidation';

/**
 * Uploads a file straight to private storage (no in-memory encoding) and
 * returns the file fields to save on the document record.
 */
export async function uploadDocumentFile(file) {
  const invalid = validateUploadFile(file);
  if (invalid) throw new Error(invalid);
  const { file_uri } = await base44.integrations.Core.UploadPrivateFile({ file });
  if (!file_uri) throw new Error('The file could not be stored. Please try again.');
  return {
    file_url: file_uri,
    file_name: file.name,
    file_size: file.size,
    mime_type: file.type || 'application/octet-stream',
  };
}

/** Exchanges a stored document for a short-lived signed URL. */
export async function resolveDocumentUrl(doc, entity = 'Document') {
  const res = await base44.functions.invoke('storageResolveUrl', { documentId: doc.id, entity });
  if (!res.data?.signed_url) throw new Error('The file link could not be created.');
  return res.data.signed_url;
}

/**
 * Downloads a stored document under its original file name. If the browser
 * cannot read the file directly, the signed link is handed to a new tab instead.
 */
export async function downloadDocument(doc, entity = 'Document') {
  if (!doc?.file_url) return;
  let url;
  try {
    url = await resolveDocumentUrl(doc, entity);
  } catch (err) {
    toast({ variant: 'destructive', title: 'Couldn’t download the file', description: 'Something went wrong while preparing this file. Please try again.' });
    return;
  }
  const link = document.createElement('a');
  link.rel = 'noopener';
  try {
    const res = await fetch(url);
    if (!res.ok) throw new Error('Download failed');
    const objectUrl = URL.createObjectURL(await res.blob());
    link.href = objectUrl;
    link.download = doc.file_name || doc.title || 'document';
    link.click();
    setTimeout(() => URL.revokeObjectURL(objectUrl), 10000);
  } catch (err) {
    link.href = url;
    link.target = '_blank';
    link.click();
  }
}

/**
 * Opens a stored document in a new tab. The tab is opened before the link is
 * requested so the browser never treats it as a blocked pop-up.
 */
export async function openDocument(doc, entity = 'Document') {
  if (!doc?.file_url) return;
  const tab = window.open('', '_blank');
  if (!tab) {
    toast({ variant: 'destructive', title: 'Couldn’t open the file', description: 'Allow pop-ups for this site and try again.' });
    return;
  }
  tab.opener = null;
  try {
    tab.location.href = await resolveDocumentUrl(doc, entity);
  } catch (err) {
    tab.close();
    toast({ variant: 'destructive', title: 'Couldn’t open the file', description: 'Something went wrong while opening this file. Please try again.' });
  }
}