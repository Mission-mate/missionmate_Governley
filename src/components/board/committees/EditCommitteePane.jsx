import React, { useState, useEffect } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { Users } from 'lucide-react';
import EditFooterActions from '@/components/shared/EditFooterActions';
import { draftEqual } from '@/lib/unsavedChanges/draftEqual';
import PaneIconHeaderActions from '@/components/shared/PaneIconHeaderActions';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import AddDescriptionToggle from '@/components/compliance/assets/AddDescriptionToggle';
import CommitteeMeetingDefaults, { CommitteeMeetingDefaultsView } from './CommitteeMeetingDefaults';
import MeetingAccessCode from './MeetingAccessCode';
import SlidePane from '@/components/ui/SlidePane';
import { COMMITTEE_PANE_CLASS } from './committeePane';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import ManageMembers from './ManageMembers';
import ViewModeHint from '@/components/shared/ViewModeHint';
import { updateCommittee } from '@/lib/committeesApi';
import useUnsavedChanges from '@/hooks/useUnsavedChanges';

const STEPS = ['Committee Details', 'Committee Members'];

function ViewField({ label, value }) {
  return (
    <div className="space-y-1.5">
      <p className="text-sm font-medium text-foreground">{label}</p>
      {value ? <p className="text-sm text-foreground whitespace-pre-wrap">{value}</p> : <p className="text-sm text-muted-foreground/50">—</p>}
    </div>
  );
}

export default function EditCommitteePane({ committee, isOpen, onClose, viewFirst = false }) {
  const qc = useQueryClient();
  const [step, setStep] = useState(0);
  const [isEditing, setIsEditing] = useState(!viewFirst);
  const viewMode = !isEditing;
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [status, setStatus] = useState('active');
  const [defaultTimezone, setDefaultTimezone] = useState('');
  const [defaultLocation, setDefaultLocation] = useState('');
  // Last saved committee — the view mode and the dirty baseline both read from it,
  // so a save made in this pane shows immediately without waiting for a refetch.
  const [saved, setSaved] = useState(committee);

  const loadFields = (c) => {
    setSaved(c);
    setName(c.name || '');
    setDescription(c.description || '');
    setStatus(c.status || 'active');
    setDefaultTimezone(c.default_timezone || '');
    setDefaultLocation(c.default_location || '');
  };

  useEffect(() => {
    if (isOpen && committee) {
      setStep(0);
      setIsEditing(!viewFirst);
      loadFields(committee);
    }
  }, [isOpen, committee?.id]);

  const save = useMutation({
    mutationFn: (payload) => updateCommittee(committee.id, payload),
    onSuccess: (_res, payload) => {
      qc.invalidateQueries({ queryKey: ['committees'] });
      qc.invalidateQueries({ queryKey: ['committeeMember'] });
      // Meetings cache committee_name — refresh so grouping and the committee
      // filter rebuild with the new name.
      qc.invalidateQueries({ queryKey: ['meetings'] });
      // Saved — back to view-only with the saved values as the new baseline.
      loadFields({ ...saved, ...payload });
      setIsEditing(false);
    },
  });
  const handleSave = () => save.mutate({
    name, description, status,
    default_timezone: defaultTimezone,
    default_location: defaultLocation.trim(),
  });

  const draft = { name, description, status, defaultTimezone, defaultLocation };
  const baseline = {
    name: saved?.name || '', description: saved?.description || '', status: saved?.status || 'active',
    defaultTimezone: saved?.default_timezone || '', defaultLocation: saved?.default_location || '',
  };
  const dirty = !draftEqual(draft, baseline);
  const { requestClose, dialog } = useUnsavedChanges({
    draft, baseline, onClose, saving: save.isPending, enabled: isOpen && !!committee, subject: 'committee changes',
  });
  // Cancel restores the saved values and returns to view-only.
  const cancelEdit = () => { loadFields(saved); setIsEditing(false); };

  if (!committee || !saved) return null;

  return (
    <>
    {dialog}
    <SlidePane isOpen={isOpen} onClose={requestClose} className={COMMITTEE_PANE_CLASS}>
      <div className="flex items-center justify-between px-6 py-4 border-b border-border shrink-0">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center">
            <Users className="w-4 h-4 text-primary" />
          </div>
          <div>
            <h2 className="font-bold text-lg">{viewMode ? 'View Committee' : 'Edit Committee'}</h2>
            <ViewModeHint className="mt-1" editing={!viewMode} />
          </div>
        </div>
        <PaneIconHeaderActions showEdit={viewMode} onEdit={() => setIsEditing(true)} onClose={requestClose} />
      </div>

      {/* Step indicator — centered with a short divider */}
      <div className="flex items-center justify-center px-6 pt-4 shrink-0">
        {STEPS.map((s, i) => (
          <React.Fragment key={s}>
            <button
              onClick={() => name.trim() && setStep(i)}
              disabled={i === 1 && !name.trim()}
              className={`group flex items-center gap-2 text-sm transition-colors ${step === i ? 'text-primary font-medium' : 'text-muted-foreground enabled:hover:text-primary'} ${i === 1 && !name.trim() ? 'opacity-50 cursor-not-allowed' : ''}`}
            >
              <span className={`w-5 h-5 rounded-full text-xs flex items-center justify-center transition-colors ${step === i ? 'bg-primary text-primary-foreground' : 'bg-muted group-enabled:group-hover:bg-primary/10 group-enabled:group-hover:text-primary'}`}>{i + 1}</span>
              {s}
            </button>
            {i === 0 && <div className="w-16 mx-3 h-px bg-border" />}
          </React.Fragment>
        ))}
      </div>

      <div className="flex-1 overflow-y-auto px-6 py-5 space-y-4">
        {step === 0 && viewMode ? (
          <>
            <ViewField label="Name" value={saved.name} />
            {saved.description?.trim() && <ViewField label="Description" value={saved.description} />}
            <ViewField label="Status" value={(saved.status || 'active') === 'active' ? 'Active' : 'Archived'} />
            <CommitteeMeetingDefaultsView committee={saved} />
            <MeetingAccessCode />
          </>
        ) : step === 0 ? (
          <>
            <div className="space-y-1.5">
              <Label>Name <span className="text-destructive">*</span></Label>
              <Input value={name} onChange={e => setName(e.target.value)} placeholder="Committee name" />
            </div>
            <AddDescriptionToggle value={description} onChange={setDescription} placeholder="What this committee does..." className="" />
            <div className="space-y-1.5">
              <Label>Status</Label>
              <Select value={status} onValueChange={setStatus}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="active">Active</SelectItem>
                  <SelectItem value="archived">Archived</SelectItem>
                </SelectContent>
              </Select>
              <p className="text-xs text-muted-foreground">
                Archiving retires the committee. Its meetings and members are kept, and it can be restored at any time.
              </p>
            </div>
            <CommitteeMeetingDefaults
              timezone={defaultTimezone}
              location={defaultLocation}
              onTimezoneChange={setDefaultTimezone}
              onLocationChange={setDefaultLocation} />
            <MeetingAccessCode />
          </>
        ) : (
          <ManageMembers committeeId={committee.id} readOnly={viewMode} />
        )}
      </div>

      <div className="flex items-center gap-3 px-6 py-4 border-t border-border shrink-0">
        {viewMode ? (
          <Button variant="outline" className="ml-auto" onClick={() => requestClose()}>Close</Button>
        ) : (
          <>
            {/* Step 1 continues with Next Step; step 2 goes Back and saves. */}
            {step === 1 && <Button variant="ghost" onClick={() => setStep(0)}>Back</Button>}
            <div className="ml-auto flex items-center gap-3">
              {step === 0 ? (
                <>
                  <Button variant="outline" onClick={cancelEdit}>Cancel</Button>
                  <Button onClick={() => setStep(1)} disabled={!name.trim()}>Next Step</Button>
                </>
              ) : (
                <EditFooterActions dirty={dirty} onCancel={cancelEdit}
                  onSave={handleSave} saving={save.isPending} saveDisabled={!name.trim()} />
              )}
            </div>
          </>
        )}
      </div>
    </SlidePane>
    </>
  );
}