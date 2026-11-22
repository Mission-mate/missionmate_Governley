import React, { useState, useEffect, useRef, forwardRef, useImperativeHandle } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import DateField from '@/components/ui/DateField';
import InfoTooltip from '@/components/risk/InfoTooltip';
import SectionCard from '@/components/shared/SectionCard';
import RichTextField from '@/components/shared/RichTextField';
import { PERSON_TYPES, APPOINTMENT_TERMS, TERM_UNITS, updatePerson, calcTermRenewalDate } from '@/lib/boardPeopleApi';
import { invalidateParticipants } from '@/lib/meetingParticipants';
import { draftEqual } from '@/lib/unsavedChanges/draftEqual';

/**
 * Committee member details edit form. Exposes save() and reset() via ref and reports
 * unsaved changes through onDirtyChange, so the hosting pane owns the footer (mirrors EditConflictForm).
 */
const EditPersonForm = forwardRef(function EditPersonForm({ person, onDirtyChange }, ref) {
  const qc = useQueryClient();
  const [form, setForm] = useState({});
  // Last saved values — drives the pane's dirty state and Cancel.
  const [baseline, setBaseline] = useState({});
  const dirty = !draftEqual(form, baseline);
  useEffect(() => { onDirtyChange?.(dirty); }, [dirty]);
  useEffect(() => () => onDirtyChange?.(false), []);
  // Track manual edits to the renewal date so auto-calc doesn't override.
  const renewalEditedRef = useRef(false);

  useEffect(() => {
    if (!person) return;
    const init = {
      type: person.type || 'board_member',
      position: person.position && person.position !== 'Member' ? person.position : '',
      director_id: person.director_id || '',
      appointment_date: person.appointment_date || '',
      appointment_term: person.appointment_term || 'Ongoing',
      interval_value: person.interval_value || '',
      interval_unit: person.interval_unit || 'Years',
      term_renewal_date: person.term_renewal_date || '',
      status: person.status || 'active',
      additional_details: person.additional_details || ''
    };
    setForm(init); setBaseline(init);
    renewalEditedRef.current = true;
  }, [person?.id]);

  const set = (key, val) => setForm((f) => ({ ...f, [key]: val }));

  const setTermField = (key, val) => {
    // term inputs reset the manual-edit flag so the renewal date re-derives
    renewalEditedRef.current = false;
    setForm((f) => {
      const next = { ...f, [key]: val };
      const date = calcTermRenewalDate({
        appointment_term: next.appointment_term,
        appointment_date: next.appointment_date,
        interval_value: next.interval_value,
        interval_unit: next.interval_unit
      });
      if (date) next.term_renewal_date = date;
      return next;
    });
  };

  useImperativeHandle(ref, () => ({
    async save() {
      if (!form.appointment_date) return false;
      const isCustom = form.appointment_term === 'Custom';
      await updatePerson(person.id, {
        type: form.type,
        position: form.position?.trim() || 'Member',
        director_id: form.director_id?.trim() || '',
        appointment_date: form.appointment_date || null,
        appointment_term: form.appointment_term || 'Ongoing',
        interval_value: isCustom ? Number(form.interval_value) || null : null,
        interval_unit: isCustom ? form.interval_unit || 'Years' : null,
        term_renewal_date: isCustom ? form.term_renewal_date || null : null,
        status: form.status || 'active',
        additional_details: form.additional_details || ''
      });
      qc.invalidateQueries({ queryKey: ['boardPeople'] });
      // Position is cached on MeetingParticipant — refresh meeting participant lists.
      invalidateParticipants(qc);
      setBaseline(form);
      return true;
    },
    reset() { setForm(baseline); }
  }), [form, baseline, person?.id]);

  const isCustom = form.appointment_term === 'Custom';

  return (
    <SectionCard className="space-y-4">
      <div className="grid grid-cols-2 gap-3">
        <div className="space-y-1.5">
          <div className="flex items-center gap-1.5 h-5">
            <Label>Member Type <span className="text-destructive">*</span></Label>
          </div>
          <Select value={form.type} onValueChange={(v) => set('type', v)}>
            <SelectTrigger className="bg-card"><SelectValue /></SelectTrigger>
            <SelectContent>
              {PERSON_TYPES.map((t) => <SelectItem key={t.value} value={t.value}>{t.label}</SelectItem>)}
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-1.5">
          <div className="flex items-center gap-1.5 h-5">
            <Label>Position</Label>
          </div>
          <Input className="bg-card" value={form.position || ''} onChange={(e) => set('position', e.target.value)} placeholder="e.g., Chair, Treasurer, Member" />
        </div>
        <div className="space-y-1.5">
          <div className="flex items-center gap-1.5 h-5">
            <Label>Date commenced <span className="text-destructive">*</span></Label>
            <InfoTooltip text="Date Commenced as Committee Member" />
          </div>
          <DateField
            inputClassName="bg-card"
            value={form.appointment_date || ''}
            onChange={(v) => { renewalEditedRef.current = false; setTermField('appointment_date', v); }} />
        </div>
        <div className="space-y-1.5">
          <div className="flex items-center gap-1.5 h-5">
            <Label>Appointment Term</Label>
          </div>
          <Select value={form.appointment_term} onValueChange={(v) => setTermField('appointment_term', v)}>
            <SelectTrigger className="bg-card"><SelectValue /></SelectTrigger>
            <SelectContent>
              {APPOINTMENT_TERMS.map((t) => <SelectItem key={t} value={t}>{t}</SelectItem>)}
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-1.5">
          <div className="flex items-center gap-1.5 h-5">
            <Label>Status</Label>
          </div>
          <Select value={form.status} onValueChange={(v) => set('status', v)}>
            <SelectTrigger className="bg-card"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="active">Active</SelectItem>
              <SelectItem value="inactive">Inactive</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-1.5">
          <div className="flex items-center gap-1.5 h-5">
            <Label>Director ID</Label>
            <InfoTooltip text="Optional: Registered Director ID administered by Australian Business Registry Services (ABRS)" />
          </div>
          <Input className="bg-card" value={form.director_id || ''} onChange={(e) => set('director_id', e.target.value)} placeholder="e.g. DIR-001" />
        </div>
      </div>

      {isCustom &&
        <div className="grid grid-cols-2 gap-3">
          <div className="space-y-1.5">
            <Label>Duration</Label>
            <Input
              className="bg-card"
              type="text"
              inputMode="numeric"
              value={form.interval_value || ''}
              onChange={(e) => setTermField('interval_value', e.target.value.replace(/\D/g, ''))}
              placeholder="e.g. 3" />
          </div>
          <div className="space-y-1.5">
            <Label>Unit</Label>
            <Select value={form.interval_unit || 'Years'} onValueChange={(v) => setTermField('interval_unit', v)}>
              <SelectTrigger className="bg-card"><SelectValue /></SelectTrigger>
              <SelectContent>
                {TERM_UNITS.map((u) => <SelectItem key={u} value={u}>{u}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
        </div>
      }

      {isCustom &&
        <div className="space-y-1.5">
          <Label>Term Expiry</Label>
          <DateField
            inputClassName="bg-card"
            value={form.term_renewal_date || ''}
            onChange={(v) => { renewalEditedRef.current = true; set('term_renewal_date', v); }} />
          <p className="text-xs text-muted-foreground">Auto-calculated from commencement date and appointment term. Admins can manually override to extend term renewals.</p>
        </div>
      }

      <div className="space-y-1.5">
        <Label>Additional Details</Label>
        <RichTextField
          value={form.additional_details || ''}
          onChange={(v) => set('additional_details', v)}
          placeholder="Add any additional details about this committee member, e.g. background, expertise or responsibilities…"
          minHeight={100} />
      </div>
    </SectionCard>
  );
});

export default EditPersonForm;