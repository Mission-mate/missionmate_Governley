import React, { useState, useEffect } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { Loader2, Users } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import AddDescriptionToggle from '@/components/compliance/assets/AddDescriptionToggle';
import CommitteeMeetingDefaults from './CommitteeMeetingDefaults';
import MeetingAccessCode from './MeetingAccessCode';
import SlidePane from '@/components/ui/SlidePane';
import { COMMITTEE_PANE_CLASS } from './committeePane';
import ManageMembers from './ManageMembers';
import { createCommittee, addCommitteeMember } from '@/lib/committeesApi';
import CloseButton from '@/components/shared/CloseButton';
import useUnsavedChanges from '@/hooks/useUnsavedChanges';

const STEPS = ['Committee Details', 'Committee Members'];
const BASELINE = { name: '', description: '', defaultTimezone: '', defaultLocation: '', staged: [] };

export default function CreateCommitteePane({ isOpen, onClose }) {
  const qc = useQueryClient();
  const [step, setStep] = useState(0);
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [defaultTimezone, setDefaultTimezone] = useState('');
  const [defaultLocation, setDefaultLocation] = useState('');
  const [stagedMembers, setStagedMembers] = useState([]);

  useEffect(() => {
    if (isOpen) {
      setStep(0);
      setName('');
      setDescription('');
      setDefaultTimezone('');
      setDefaultLocation('');
      setStagedMembers([]);
    }
  }, [isOpen]);

  // Create the committee and persist any staged members only on final confirmation.
  const create = useMutation({
    mutationFn: async () => {
      const created = await createCommittee({ name, description, default_timezone: defaultTimezone, default_location: defaultLocation.trim() });
      for (const m of stagedMembers) {
        await addCommitteeMember(created.id, { id: m.board_person_id, user_id: m.user_id, member_name: m.member_name, member_email: m.member_email });
      }
      return created;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['committees'] });
      qc.invalidateQueries({ queryKey: ['committeeMembers'] });
      onClose();
    },
  });

  const guard = useUnsavedChanges({
    draft: { name, description, defaultTimezone, defaultLocation, staged: stagedMembers.map((m) => m.user_id || m.board_person_id) },
    baseline: BASELINE,
    onClose,
    saving: create.isPending,
    enabled: isOpen,
    subject: 'committee details',
  });

  return (
    <>
      {guard.dialog}
      <SlidePane isOpen={isOpen} onClose={guard.requestClose} className={COMMITTEE_PANE_CLASS}>
        <div className="flex items-center justify-between px-6 py-4 border-b border-border shrink-0">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center">
              <Users className="w-4 h-4 text-primary" />
            </div>
            <h2 className="font-bold text-lg">New Committee</h2>
          </div>
          <CloseButton onClick={() => guard.requestClose()} />
        </div>

        {/* Step indicator — centered with a short divider */}
        <div className="flex items-center justify-center px-6 pt-4 shrink-0">
          {STEPS.map((s, i) => (
            <React.Fragment key={s}>
              <button
                disabled={i === 1 && !name.trim()}
                onClick={() => name.trim() && setStep(i)}
                className={`flex items-center gap-2 text-sm ${step === i ? 'text-primary font-medium' : 'text-muted-foreground'} ${i === 1 && !name.trim() ? 'opacity-50 cursor-not-allowed' : ''}`}
              >
                <span className={`w-5 h-5 rounded-full text-xs flex items-center justify-center ${step === i ? 'bg-primary text-primary-foreground' : 'bg-muted'}`}>{i + 1}</span>
                {s}
              </button>
              {i === 0 && <div className="w-16 mx-3 h-px bg-border" />}
            </React.Fragment>
          ))}
        </div>

        <div className="flex-1 overflow-y-auto px-6 py-5 space-y-4">
          {step === 0 ? (
            <>
              <div className="space-y-1.5">
                <Label>Name <span className="text-destructive">*</span></Label>
                <Input value={name} onChange={e => setName(e.target.value)} placeholder="Committee name" />
              </div>
              <AddDescriptionToggle value={description} onChange={setDescription} placeholder="What this committee does..." className="" />
              <CommitteeMeetingDefaults
                timezone={defaultTimezone}
                location={defaultLocation}
                onTimezoneChange={setDefaultTimezone}
                onLocationChange={setDefaultLocation} />
              <MeetingAccessCode placeholder />
            </>
          ) : (
            <ManageMembers staged={stagedMembers} onStagedChange={setStagedMembers} />
          )}
        </div>

        <div className="flex justify-end gap-2 px-6 py-4 border-t border-border shrink-0">
          {step === 0 ? (
            <>
              <Button variant="outline" onClick={() => guard.requestClose()}>Cancel</Button>
              <Button onClick={() => setStep(1)} disabled={!name.trim()}>Next Step</Button>
            </>
          ) : (
            <>
              <Button variant="outline" onClick={() => setStep(0)}>Back</Button>
              <Button onClick={() => create.mutate()} disabled={!name.trim() || create.isPending}>
                {create.isPending && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                Create Committee
              </Button>
            </>
          )}
        </div>
      </SlidePane>
    </>
  );
}