import React, { useState, useEffect } from 'react';
import { Loader2 } from 'lucide-react';
import { base44 } from '@/api/base44Client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import SlidePane from '@/components/ui/SlidePane';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { DOC_TYPES } from '@/lib/boardDocuments';
import CloseButton from '@/components/shared/CloseButton';
import useUnsavedChanges from '@/hooks/useUnsavedChanges';

export default function EditBoardDocumentPane({ doc, onClose, onSaved }) {
  const [title, setTitle] = useState('');
  const [docType, setDocType] = useState('document');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (doc) { setTitle(doc.title || ''); setDocType(doc.doc_type || 'document'); }
  }, [doc]);

  const { requestClose, dialog } = useUnsavedChanges({
    draft: { title, docType },
    baseline: { title: doc?.title, docType: doc?.doc_type || 'document' },
    onClose, saving, enabled: !!doc, subject: 'document changes',
  });

  const handleSave = async () => {
    if (!title.trim()) return;
    setSaving(true);
    await base44.entities.Document.update(doc.id, { title: title.trim(), doc_type: docType });
    setSaving(false);
    onSaved();
    onClose();
  };

  return (
    <>
    {dialog}
    <SlidePane isOpen={!!doc} onClose={requestClose}>
      <div className="h-full bg-white dark:bg-card flex flex-col shadow-2xl">
        <div className="flex items-center justify-between px-6 py-5 border-b border-border shrink-0">
          <h2 className="text-lg font-bold text-foreground">Edit Document</h2>
          <CloseButton onClick={() => requestClose()} />
        </div>

        <div className="flex-1 overflow-y-auto px-6 py-5 space-y-4">
          <div>
            <label className="text-sm font-semibold text-foreground block mb-1.5">Document Title <span className="text-destructive">*</span></label>
            <Input value={title} onChange={e => setTitle(e.target.value)} placeholder="Enter document title" className="h-11" autoFocus />
          </div>
          <div>
            <label className="text-sm font-semibold text-foreground block mb-1.5">Document Type <span className="text-destructive">*</span></label>
            <Select value={docType} onValueChange={setDocType}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                {DOC_TYPES.map(t => <SelectItem key={t.key} value={t.key}>{t.label}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
        </div>

        <div className="flex items-center justify-end gap-3 px-6 py-4 border-t border-border shrink-0">
          <Button variant="outline" onClick={() => requestClose()}>Cancel</Button>
          <Button onClick={handleSave} disabled={!title.trim() || saving}>
            {saving ? <><Loader2 className="w-4 h-4 animate-spin" /> Saving...</> : 'Save Changes'}
          </Button>
        </div>
      </div>
    </SlidePane>
    </>
  );
}