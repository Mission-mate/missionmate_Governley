import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import ModalOverlay from '@/components/ui/ModalOverlay';
import { toast } from '@/components/ui/use-toast';
import FolderSelect from '@/components/board/documents/FolderSelect';
import useUnsavedChanges from '@/hooks/useUnsavedChanges';

const LABEL = 'text-xs font-semibold text-foreground block mb-1.5';

/** Edit a document's title and the folder it lives in. */
export default function EditDocumentModal({ doc, folders, entity = 'Document', onSaved, onClose }) {
  const [title, setTitle] = useState('');
  const [folderId, setFolderId] = useState('');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (doc) { setTitle(doc.title || ''); setFolderId(doc.folder_id || ''); setSaving(false); }
  }, [doc?.id]);

  const { requestClose, dialog } = useUnsavedChanges({
    draft: { title, folderId },
    baseline: { title: doc?.title || '', folderId: doc?.folder_id || '' },
    onClose, saving, enabled: !!doc, subject: 'document changes',
  });

  const canSave = title.trim().length > 0 && !!folderId;

  const handleSave = async () => {
    if (!canSave || saving) return;
    setSaving(true);
    try {
      await base44.entities[entity].update(doc.id, { title: title.trim(), folder_id: folderId });
      await onSaved();
      onClose();
    } catch (err) {
      toast({ variant: 'destructive', title: 'Couldn’t save document', description: 'Something went wrong. Please try again.' });
    } finally {
      setSaving(false);
    }
  };

  return (
    <ModalOverlay isOpen={!!doc} onClose={requestClose} className="w-full max-w-sm">
      <div className="bg-card rounded-xl shadow-2xl p-6">
        <h2 className="text-lg font-bold text-foreground mb-5">Edit Document</h2>
        <label className={LABEL}>Document Title <span className="text-destructive">*</span></label>
        <Input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Enter document title" className="mb-4" autoFocus />
        <label className={LABEL}>Folder <span className="text-destructive">*</span></label>
        <FolderSelect folders={folders} value={folderId} onSelect={setFolderId} />
        <div className="flex items-center justify-end gap-3 mt-6">
          <Button variant="outline" onClick={() => requestClose()} disabled={saving}>Cancel</Button>
          <Button onClick={handleSave} disabled={!canSave || saving}>{saving ? 'Saving...' : 'Save'}</Button>
        </div>
      </div>
      {dialog}
    </ModalOverlay>
  );
}