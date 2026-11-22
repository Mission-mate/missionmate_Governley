import React, { useState } from 'react';
import { Video, ExternalLink, Loader2, X } from 'lucide-react';
import { base44 } from '@/api/base44Client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { toast } from '@/components/ui/use-toast';
import ConfirmTypeDialog from '@/components/board/documents/ConfirmTypeDialog';
import { LIFT_HOVER } from '@/components/shared/liftHover';
import { ELEVATED_CARD } from '@/components/shared/cardStyles';

export default function VideoConferencingCard({ meeting, onSaved }) {
  const [adding, setAdding] = useState(false);
  const [link, setLink] = useState('');
  const [saving, setSaving] = useState(false);
  const [confirmRemove, setConfirmRemove] = useState(false);

  const hasLink = !!meeting.video_link;

  const save = async () => {
    if (!link.trim()) return;
    setSaving(true);
    await base44.entities.Meeting.update(meeting.id, { video_link: link.trim() });
    setSaving(false);
    setAdding(false);
    setLink('');
    onSaved?.();
  };

  const remove = async () => {
    setSaving(true);
    try {
      await base44.entities.Meeting.update(meeting.id, { video_link: '' });
      setConfirmRemove(false);
      onSaved?.();
    } catch (err) {
      console.error('Failed to remove video link', err);
      toast({ variant: 'destructive', title: 'Could not remove link', description: 'Please try again.' });
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className={`${ELEVATED_CARD} p-6`}>
      <div className="flex items-center gap-2 mb-4">
        <Video className="w-5 h-5 text-primary" />
        <h2 className="text-lg font-bold text-foreground">Video Conferencing</h2>
      </div>

      {hasLink ? (
        <div className="space-y-3">
          <Button className={`w-full ${LIFT_HOVER}`} asChild>
            <a href={meeting.video_link} target="_blank" rel="noopener noreferrer"><ExternalLink className="w-4 h-4" /> Join Meeting</a>
          </Button>
          <button onClick={() => setConfirmRemove(true)} disabled={saving} className="flex items-center justify-center gap-1.5 w-full text-xs text-muted-foreground hover:text-destructive transition-colors">
            <X className="w-3.5 h-3.5" /> Remove link
          </button>
        </div>
      ) : adding ? (
        <div className="space-y-3">
          <Input value={link} onChange={e => setLink(e.target.value)} placeholder="Paste meeting link..." autoFocus />
          <div className="flex items-center gap-2">
            <Button variant="outline" className="flex-1" onClick={() => { setAdding(false); setLink(''); }}>Cancel</Button>
            <Button className="flex-1" onClick={save} disabled={!link.trim() || saving}>
              {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Save'}
            </Button>
          </div>
        </div>
      ) : (
        <>
          <p className="text-sm text-muted-foreground mb-3">No video link added.</p>
          <Button variant="outline" className={`w-full ${LIFT_HOVER}`} onClick={() => setAdding(true)}>Add Link</Button>
        </>
      )}

      <ConfirmTypeDialog
        isOpen={confirmRemove}
        title="Remove Video Link"
        message="This will remove the video conferencing link from this meeting."
        keyword="CONFIRM"
        confirmLabel="Remove"
        onConfirm={remove}
        onClose={() => setConfirmRemove(false)}
      />
    </div>
  );
}