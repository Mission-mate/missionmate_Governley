import React, { useState, useEffect } from 'react';
import { Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import ModalOverlay from '@/components/ui/ModalOverlay';
import CloseButton from '@/components/shared/CloseButton';
import FolderSelect from '@/components/board/documents/FolderSelect';
import useUnsavedChanges from '@/hooks/useUnsavedChanges';
import UploadZone from './UploadZone';
import useDocumentUpload from './useDocumentUpload';

const EMPTY_DOC = { title: '', folderId: '', file: null };
const LABEL = 'text-xs font-semibold text-foreground block mb-1.5';

/** Centred modal that adds a document to a record's repository: title, folder and one file, saved to private storage. */
export default function AddDocumentModal({ isOpen, onClose, folders, objectType, objectId, currentUser, onSaved, documentEntity = 'Document', defaultFolderId = '', extraFields }) {
  const [title, setTitle] = useState('');
  const [folderId, setFolderId] = useState('');
  const { file, setFile, saving, error, save } = useDocumentUpload({ isOpen, entity: documentEntity, onSaved, onClose });

  // Opens on the folder being viewed, when there is one.
  useEffect(() => {
    if (isOpen) { setTitle(''); setFolderId(defaultFolderId); }
  }, [isOpen]);

  const { requestClose, dialog } = useUnsavedChanges({
    draft: { title: title.trim(), folderId, file: file?.name || null },
    baseline: { ...EMPTY_DOC, folderId: defaultFolderId }, onClose, saving, enabled: isOpen, subject: 'document details',
  });

  const canSave = title.trim().length > 0 && !!folderId && !!file;

  const handleSave = () => save({
    ...extraFields,
    object_type: objectType,
    object_id: objectId,
    folder_id: folderId,
    title: title.trim(),
    created_by_name: currentUser?.full_name || 'System',
  });

  return (
    <ModalOverlay isOpen={isOpen} onClose={requestClose} className="w-full max-w-lg">
      <div className="bg-card rounded-xl shadow-2xl flex flex-col max-h-[calc(100vh-2rem)] overflow-hidden">
        <div className="flex items-center justify-between px-6 py-4 border-b border-border shrink-0">
          <h2 className="text-lg font-bold text-foreground">Add Document</h2>
          <CloseButton onClick={() => requestClose()} />
        </div>

        <div className="flex-1 overflow-y-auto px-6 py-5 space-y-4">
          <div>
            <label className={LABEL}>Document Title <span className="text-destructive">*</span></label>
            <Input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Enter document title" className="h-11" autoFocus />
          </div>
          <div>
            <label className={LABEL}>Folder <span className="text-destructive">*</span></label>
            <FolderSelect folders={folders} value={folderId} onSelect={setFolderId} />
            {folders.length === 0 &&
              <p className="text-xs text-muted-foreground mt-1.5">No folders yet. Create one first with New Folder.</p>
            }
          </div>
          <div>
            <label className={LABEL}>File <span className="text-destructive">*</span></label>
            <UploadZone file={file} onFile={setFile} error={error} />
          </div>
        </div>

        <div className="flex items-center justify-end gap-3 px-6 py-4 border-t border-border shrink-0">
          <Button variant="outline" onClick={() => requestClose()} disabled={saving}>Cancel</Button>
          <Button onClick={handleSave} disabled={!canSave || saving}>
            {saving ? <><Loader2 className="w-4 h-4 animate-spin" /> Saving...</> : 'Save Document'}
          </Button>
        </div>
      </div>
      {dialog}
    </ModalOverlay>
  );
}