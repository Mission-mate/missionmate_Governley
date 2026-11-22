import React, { useEffect, useState } from 'react';
import { Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import MotionModal from '@/components/shared/MotionModal';
import CapsuleTabs from '@/components/board/CapsuleTabs';
import MemberPicker from './MemberPicker';
import GroupColorPicker from './GroupColorPicker';
import { startDirect, createGroup, apiErrorMessage } from '@/lib/conversationsApi';
import { DEFAULT_GROUP_COLOR } from '@/lib/groupColors';

const MODES = [
  { value: 'direct', label: 'Direct Message' },
  { value: 'group', label: 'Group Chat' },
];

/** Starts a one-to-one conversation or creates a group. `onCreated(conversation)` receives the result. */
export default function NewConversationModal({ isOpen, onClose, candidates, onCreated }) {
  const [mode, setMode] = useState('direct');
  const [name, setName] = useState('');
  const [color, setColor] = useState(DEFAULT_GROUP_COLOR);
  const [selectedIds, setSelectedIds] = useState([]);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!isOpen) return;
    setMode('direct');
    setName('');
    setColor(DEFAULT_GROUP_COLOR);
    setSelectedIds([]);
    setBusy(false);
    setError('');
  }, [isOpen]);

  const run = async (request) => {
    setBusy(true);
    setError('');
    try {
      onCreated(await request());
    } catch (err) {
      setError(apiErrorMessage(err));
      setBusy(false);
    }
  };

  const toggle = (id) => setSelectedIds((ids) => (ids.includes(id) ? ids.filter((x) => x !== id) : [...ids, id]));
  const canCreate = !busy && name.trim().length > 0 && selectedIds.length > 0;

  return (
    <MotionModal
      isOpen={isOpen}
      onClose={onClose}
      title="New conversation"
      maxWidth="max-w-md"
      footer={mode === 'group' && (
        <>
          <Button variant="outline" onClick={onClose} disabled={busy}>Cancel</Button>
          <Button onClick={() => run(() => createGroup(name.trim(), selectedIds, color))} disabled={!canCreate}>
            {busy ? <><Loader2 className="w-4 h-4 animate-spin" /> Creating...</> : 'Create group'}
          </Button>
        </>
      )}
    >
      <div className="flex justify-center mb-4">
        <CapsuleTabs tabs={MODES} value={mode} onChange={(next) => { setMode(next); setError(''); }} />
      </div>
      {mode === 'group' && (
        <div className="space-y-1.5 mb-4">
          <Label htmlFor="group-name">Group name <span className="text-destructive">*</span></Label>
          <Input id="group-name" value={name} maxLength={80} placeholder="e.g. Events team" onChange={(e) => setName(e.target.value)} />
        </div>
      )}
      {mode === 'group' && (
        <div className="mb-4">
          <p className="text-sm font-medium text-foreground mb-2.5">Group colour</p>
          <GroupColorPicker value={color} onChange={setColor} disabled={busy} />
        </div>
      )}
      <p className="text-sm font-medium text-foreground mb-2">
        {mode === 'group' ? `Members${selectedIds.length ? ` (${selectedIds.length} selected)` : ''}` : 'Choose a team member'}
      </p>
      <MemberPicker
        candidates={candidates}
        selectedIds={mode === 'group' ? selectedIds : undefined}
        onPick={mode === 'group' ? toggle : (id) => run(() => startDirect(id))}
        disabled={busy}
      />
      {error && <p className="text-sm text-destructive mt-3">{error}</p>}
    </MotionModal>
  );
}