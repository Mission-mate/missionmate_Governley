import React, { useState, useEffect } from 'react';
import { Loader2 } from 'lucide-react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import ModalOverlay from '@/components/ui/ModalOverlay';
import UploadZone from '@/components/documents/UploadZone';
import useDocumentUpload from '@/components/documents/useDocumentUpload';
import { DOC_TYPES, BOARD_OBJECT_TYPE } from '@/lib/boardDocuments';
import CloseButton from '@/components/shared/CloseButton';
import useUnsavedChanges from '@/hooks/useUnsavedChanges';

const LABEL = 'text-sm font-semibold text-foreground block mb-1.5';

export default function AddMeetingDocumentModal({ isOpen, onClose, meeting, currentUser, onSaved }) {
  const [title, setTitle] = useState('');
  const [docType, setDocType] = useState('document');
  const { file, setFile, saving, error, save } = useDocumentUpload({ isOpen, onSaved, onClose });

  useEffect(() => {
    if (isOpen) { setTitle(''); setDocType('document'); }
  }, [isOpen]);

  const canSave = title.trim().length > 0 && !!docType && !!file;

  const { requestClose, dialog } = useUnsavedChanges({
    draft: { title, docType, file: file?.name || null },
    baseline: { title: '', docType: 'document', file: null },
    onClose, saving, enabled: isOpen, subject: 'document details',
  });

  const handleSave = () => save({
    object_type: BOARD_OBJECT_TYPE,
    object_id: meeting.id,
    board_category: 'meeting',
    doc_type: docType,
    meeting_id: meeting.id,
    title: title.trim(),
    created_by_name: currentUser?.full_name || 'System',
  });

  return (
    <>
    {dialog}
    <ModalOverlay isOpen={isOpen} onClose={() => requestClose()} className="w-full max-w-lg">
      <div className="bg-card rounded-xl border border-border max-h-[90vh] flex flex-col shadow-2xl">
        <div className="flex items-center justify-between px-6 py-4 border-b border-border shrink-0">
          <h2 className="text-lg font-bold text-foreground">Add Document</h2>
          <CloseButton onClick={() => requestClose()} />
        </div>

        <div className="px-6 py-5 flex-1 min-h-0 overflow-y-auto space-y-4">
          <div>
            <label className={LABEL}>Document Title <span className="text-destructive">*</span></label>
            <Input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Enter document title" className="h-11" autoFocus />
          </div>
          <div>
            <label className={LABEL}>Document Type</label>
            <Select value={docType} onValueChange={setDocType}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                {DOC_TYPES.map((t) => <SelectItem key={t.key} value={t.key}>{t.label}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
          <div>
            <label className={LABEL}>Meeting Linked</label>
            <Input value={meeting?.title || ''} disabled className="h-11 bg-muted/50 text-muted-foreground cursor-not-allowed" />
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
    </ModalOverlay>
    </>
  );
}