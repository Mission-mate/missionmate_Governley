import React, { useState, useEffect } from 'react';
import { Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import ParentDocumentPicker from './ParentDocumentPicker';
import ModalOverlay from '@/components/ui/ModalOverlay';
import { linkExisting } from '@/lib/policies';
import { guardSave } from '@/lib/saveGuard';

/** Link a standalone document (no parent, no linked documents of its own) under a policy. */
export default function LinkExistingDialog({ isOpen, onClose, parent, docs, onLinked }) {
  const [childId, setChildId] = useState('');
  const [share, setShare] = useState(true);
  const [busy, setBusy] = useState(false);
  useEffect(() => { if (isOpen) { setChildId(''); setShare(true); } }, [isOpen]);

  const options = docs.filter((d) => d.id !== parent.id && !d.parent_id && !docs.some((c) => c.parent_id === d.id));
  const link = guardSave(setBusy, async () => { setBusy(true); await linkExisting(childId, parent, share); setBusy(false); onLinked(); onClose(); }, 'Could not link the document');

  return (
    <ModalOverlay isOpen={isOpen} onClose={onClose} className="w-full max-w-md">
      <div className="bg-card rounded-2xl shadow-2xl p-6 space-y-4">
        <div>
          <h3 className="text-lg font-bold text-foreground">Link Existing Document</h3>
          <p className="text-sm text-muted-foreground mt-1">The document will take the category "{parent.category}" from this policy.</p>
        </div>
        <div>
          <Label className="mb-1 block text-xs text-muted-foreground">Document</Label>
          <ParentDocumentPicker
            value={childId}
            onChange={setChildId}
            parents={options}
            showType
            placeholder="Search by Title"
            emptyText={options.length ? 'No matching documents.' : 'No documents available.'}
          />
        </div>
        <label className="flex items-center justify-between gap-3 rounded-lg border border-border px-4 py-3">
          <span className="text-sm font-medium text-foreground">Share parent's review date</span>
          <Switch checked={share} onCheckedChange={setShare} />
        </label>
        <div className="flex justify-end gap-2">
          <Button variant="outline" onClick={onClose}>Cancel</Button>
          <Button onClick={link} disabled={!childId || busy}>{busy && <Loader2 className="w-4 h-4 animate-spin" />}Link Document</Button>
        </div>
      </div>
    </ModalOverlay>
  );
}