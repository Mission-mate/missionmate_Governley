import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import ModalOverlay from '@/components/ui/ModalOverlay';
import SlidePane from '@/components/ui/SlidePane';
import DateField from '@/components/ui/DateField';
import TimePicker from '@/components/ui/TimePicker';
import CommitteeSearch from '@/components/board/CommitteeSearch';
import { TIMEZONES, MEETING_TYPES } from '@/lib/boardMeetings';
import { cn } from '@/lib/utils';
import { parseISO } from 'date-fns';
import CloseButton from '@/components/shared/CloseButton';
import { toast } from '@/components/ui/use-toast';
import useUnsavedChanges from '@/hooks/useUnsavedChanges';
import useFieldErrors from '@/hooks/useFieldErrors';
import FieldError from '@/components/shared/FieldError';
const EMPTY = {
  title: '',
  committee_id: '',
  committee_name: '',
  meeting_type: 'in_person',
  meeting_date: '',
  timezone: 'sydney',
  start_time: '',
  end_time: '',
  location: '',
  address: ''
};

// Times are stored as "HH:mm" 24-hour strings, so a string compare is enough.
const meetingErrors = (f) => Object.fromEntries(Object.entries({
  title: !f.title.trim() && 'Meeting title is required.',
  committee_id: !f.committee_id && 'Please select a meeting committee.',
  meeting_type: !f.meeting_type && 'Please select a meeting type.',
  meeting_date: !f.meeting_date ? 'Meeting date is required.' : isNaN(parseISO(f.meeting_date).getTime()) && 'Please enter a valid meeting date.',
  timezone: !f.timezone && 'Time zone is required.',
  start_time: !f.start_time && 'Start time is required.',
  end_time: !f.end_time ? 'End time is required.' : f.start_time && f.end_time <= f.start_time && 'End time must be after start time.',
}).filter(([, v]) => v));

export default function CreateMeetingModal({ isOpen, onClose, onSaved, initialData = null, currentUser, asPane = false }) {
  const [form, setForm] = useState(EMPTY);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const { errors, check, reset } = useFieldErrors(meetingErrors, form);

  // Reset form when opening
  useEffect(() => {
    if (!isOpen) return;
    setError(''); reset();
    if (initialData?.id) {
      setForm({ ...EMPTY, ...initialData });
    } else {
      setForm(EMPTY);
    }
  }, [isOpen, initialData]);

  const set = (field, val) => setForm((f) => ({ ...f, [field]: val }));

  // When a committee is selected on a new meeting, auto-fill its saved
  // meeting defaults (configured on the committee). Fields stay editable.
  const applyCommitteeDefaults = async (committeeId) => {
    if (!committeeId || initialData?.id) return;
    const committee = await base44.entities.Committee.get(committeeId);
    setForm((f) => ({
      ...f,
      timezone: committee?.default_timezone || f.timezone,
      location: committee?.default_location || f.location,
    }));
  };

  const handleSubmit = async () => {
    setError('');
    if (!check()) return;
    // calendar_year is derived from meeting_date — validated above, never NaN.
    const parsedDate = parseISO(form.meeting_date);

    setSaving(true);
    const data = { ...form, calendar_year: parsedDate.getFullYear(), status: 'scheduled' };

    // A failed save must never leave the button stuck on "Saving..." — reset the
    // flag in finally and keep the modal open so the user's input is retained.
    try {
      if (initialData?.id) {
        await base44.entities.Meeting.update(initialData.id, data);
      } else {
        await base44.entities.Meeting.create(data);
      }
    } catch (err) {
      toast({
        variant: 'destructive',
        title: isEdit ? 'Could not save meeting' : 'Could not create meeting',
        description: err?.message || 'Something went wrong. Please try again.'
      });
      return;
    } finally {
      setSaving(false);
    }

    onSaved();
    onClose();
  };

  const isEdit = !!initialData?.id;

  const { requestClose, dialog } = useUnsavedChanges({
    draft: { form },
    baseline: { form: initialData?.id ? { ...EMPTY, ...initialData } : EMPTY },
    onClose, saving, enabled: isOpen, subject: 'meeting changes',
  });

  // A meeting can never exist without a date and a valid start/end time, so the
  // save button stays disabled until every mandatory field is filled. Location
  // and address are optional and deliberately not part of this check.
  const canSubmit =
    !!form.title.trim() &&
    !!form.committee_id &&
    !!form.meeting_type &&
    !!form.meeting_date &&
    !!form.timezone &&
    !!form.start_time &&
    !!form.end_time &&
    form.end_time > form.start_time;

  const inner = (
    <>
        <div className="flex items-center justify-between p-6 pb-4 shrink-0">
          <h2 className="text-xl font-bold text-foreground">{isEdit ? 'Edit Meeting' : 'Create a New Meeting'}</h2>
          <CloseButton onClick={() => requestClose()} />
        </div>

        <div className={cn('px-6 pb-2 space-y-4', asPane && 'flex-1 overflow-y-auto')}>
          {/* Title */}
          <div>
            <label className="block text-sm font-medium text-foreground mb-1.5">Meeting Title <span className="text-destructive">*</span></label>
            <Input placeholder="e.g. July Board Meeting" value={form.title} onChange={(e) => set('title', e.target.value)} />
            <FieldError msg={errors.title} />
          </div>

          {/* Committee */}
          <div>
            <label className="block text-sm font-medium text-foreground mb-1.5">Meeting Committee <span className="text-destructive">*</span></label>
            <CommitteeSearch
              value={{ id: form.committee_id, name: form.committee_name }}
              onChange={({ id, name }) => {set('committee_id', id);set('committee_name', name);applyCommitteeDefaults(id);}} />
            <FieldError msg={errors.committee_id} />
          </div>

          {/* Meeting Type — tab selector */}
          <div>
            <label className="block text-sm font-medium text-foreground mb-1.5">Meeting Type</label>
            <div className="flex items-center gap-1 bg-muted p-1 rounded-xl">
              {MEETING_TYPES.map((t) => {
                const active = form.meeting_type === t.key;
                return (
                  <button
                    key={t.key}
                    type="button"
                    onClick={() => set('meeting_type', t.key)}
                    className={cn(
                      'flex-1 px-4 py-1.5 text-sm font-medium rounded-lg transition-all',
                      active ? 'bg-[hsl(var(--tab-active))] text-foreground font-semibold shadow-sm dark:shadow-black/30' : 'text-muted-foreground hover:text-foreground'
                    )}>
                    
                    {t.label}
                  </button>);

              })}
            </div>
            <FieldError msg={errors.meeting_type} />
          </div>

          {/* Date + Timezone */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-foreground mb-1.5">Date <span className="text-destructive">*</span></label>
              <DateField value={form.meeting_date} onChange={(v) => set('meeting_date', v)} />
              <FieldError msg={errors.meeting_date} />
            </div>
            <div>
              <label className="block text-sm font-medium text-foreground mb-1.5">Time Zone <span className="text-destructive">*</span></label>
              <Select value={form.timezone} onValueChange={(v) => set('timezone', v)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {TIMEZONES.map((tz) => <SelectItem key={tz.key} value={tz.key}>{tz.label}</SelectItem>)}
                </SelectContent>
              </Select>
              <FieldError msg={errors.timezone} />
            </div>
          </div>

          {/* Start + End time */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-foreground mb-1.5">Start Time <span className="text-destructive">*</span></label>
              <TimePicker value={form.start_time} onChange={(v) => set('start_time', v)} placeholder="--:-- --" />
              <FieldError msg={errors.start_time} />
            </div>
            <div>
              <label className="block text-sm font-medium text-foreground mb-1.5">End Time <span className="text-destructive">*</span></label>
              <TimePicker value={form.end_time} onChange={(v) => set('end_time', v)} placeholder="--:-- --" />
              <FieldError msg={errors.end_time} />
            </div>
          </div>

          {/* Location */}
          <div>
            <label className="block text-sm font-medium text-foreground mb-1.5">Location Name (e.g. Room Number, Level)</label>
            <Input placeholder="Head Office Boardroom" value={form.location} onChange={(e) => set('location', e.target.value)} />
          </div>

          {error && <p className="text-xs text-destructive">{error}</p>}
        </div>

        <div className="flex items-center justify-end gap-3 px-6 py-4 shrink-0 border-t border-border">
          <Button variant="outline" onClick={() => requestClose()}>Cancel</Button>
          <Button onClick={handleSubmit} disabled={saving || !canSubmit}>
            {saving ? 'Saving...' : isEdit ? 'Save Changes' : 'Create meeting'}
          </Button>
        </div>
    </>
  );

  if (asPane) {
    return (
      <>
      {dialog}
      <SlidePane isOpen={isOpen} onClose={requestClose}>
        <div className="bg-white dark:bg-card h-full flex flex-col shadow-2xl">
          {inner}
        </div>
      </SlidePane>
      </>);
  }

  return (
    <>
    {dialog}
    <ModalOverlay isOpen={isOpen} onClose={requestClose} className="w-full max-w-lg">
      <div className="bg-white rounded-2xl shadow-2xl max-h-[88vh] overflow-y-auto">
        {inner}
      </div>
    </ModalOverlay>
    </>);

}