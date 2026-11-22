import React, { useState, useRef } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { Loader2, UserPlus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import ModalOverlay from '@/components/ui/ModalOverlay';
import UserSearch from '@/components/board/UserSearch';
import MemberIdentityFields from '@/components/board/people/MemberIdentityFields';
import DateField from '@/components/ui/DateField';
import InfoTooltip from '@/components/risk/InfoTooltip';
import { PERSON_TYPES, APPOINTMENT_TERMS, TERM_UNITS, addPerson, calcTermRenewalDate } from '@/lib/boardPeopleApi';
import CloseButton from '@/components/shared/CloseButton';
import useUnsavedChanges from '@/hooks/useUnsavedChanges';

const EMPTY = {
  type: 'board_member',
  position: '',
  contact_number: '',
  appointment_start_date: '',
  director_id: '',
  appointment_date: '',
  appointment_term: 'Ongoing',
  interval_value: '',
  interval_unit: 'Years',
  term_renewal_date: '',
  status: 'active'
};
const BASELINE = { userId: null, form: EMPTY };

export default function AddPersonModal({ isOpen, onClose, existingUserIds = [] }) {
  const qc = useQueryClient();
  const [user, setUser] = useState(null);
  const [form, setForm] = useState(EMPTY);
  // Track manual edits to the renewal date so auto-calc doesn't override.
  const renewalEditedRef = useRef(false);

  const reset = () => {setUser(null);setForm(EMPTY);renewalEditedRef.current = false;};
  const handleClose = () => {reset();onClose();};

  const set = (key, val) => setForm((f) => ({ ...f, [key]: val }));

  const setTermField = (key, val) => {
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

  const mutation = useMutation({
    mutationFn: async () => addPerson({
      user,
      ...form,
      position: form.position.trim() || 'Member',
      appointment_start_date: null
    }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['boardPeople'] });
      qc.invalidateQueries({ queryKey: ['committeeMembers'] });
      handleClose();
    }
  });

  const isCustom = form.appointment_term === 'Custom';

  const guard = useUnsavedChanges({
    draft: { userId: user?.id || null, form },
    baseline: BASELINE,
    onClose: handleClose,
    saving: mutation.isPending,
    enabled: isOpen,
  });

  return (
    <ModalOverlay isOpen={isOpen} onClose={guard.requestClose}>
      <div className="bg-card w-[34rem] max-w-[92vw] rounded-2xl shadow-xl border border-border max-h-[88vh] flex flex-col">
        <div className="flex items-center justify-between px-6 py-4 border-b border-border">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center">
              <UserPlus className="w-4 h-4 text-primary" />
            </div>
            <h2 className="font-bold text-lg">Add New Committee Member</h2>
          </div>
          <CloseButton onClick={() => guard.requestClose()} />
        </div>

        <div className="px-6 py-5 space-y-4 overflow-y-auto">
          <div className="space-y-1.5">
            <div className="flex items-center gap-1.5 h-5">
              <Label>Committee Member <span className="text-destructive">*</span></Label>
              <InfoTooltip text="Search for members added from 'Team Member Management' settings." />
            </div>
            <UserSearch value={user} onChange={setUser} excludeIds={existingUserIds} />
          </div>

          {user && <MemberIdentityFields user={user} />}

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <div className="flex items-center gap-1.5 h-5">
                <Label>Member Type <span className="text-destructive">*</span></Label>
                <InfoTooltip text={"e.g., Board Member - Chair, Treasurer\nNon-Board Member - Staff, Observers"} />
              </div>
              <Select value={form.type} onValueChange={(v) => set('type', v)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {PERSON_TYPES.map((t) => <SelectItem key={t.value} value={t.value}>{t.label}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <div className="flex items-center gap-1.5 h-5">
                <Label>Position</Label>
              </div>
              <Input value={form.position} onChange={(e) => set('position', e.target.value)} placeholder="e.g., Chair, Treasurer, Member" />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <div className="flex items-center gap-1.5 h-5">
                <Label>Date commenced <span className="text-destructive">*</span></Label>
                <InfoTooltip text="Date Commenced as Committee Member" />
              </div>
              <DateField
                value={form.appointment_date || ''}
                onChange={(v) => {renewalEditedRef.current = false;setTermField('appointment_date', v);}} />
            </div>
            <div className="space-y-1.5">
              <div className="flex items-center gap-1.5 h-5">
                <Label>Appointment Term</Label>
              </div>
              <Select value={form.appointment_term} onValueChange={(v) => setTermField('appointment_term', v)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {APPOINTMENT_TERMS.map((t) => <SelectItem key={t} value={t}>{t}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
          </div>

          {isCustom &&
          <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label>Duration</Label>
                <Input
                type="text"
                inputMode="numeric"
                value={form.interval_value || ''}
                onChange={(e) => setTermField('interval_value', e.target.value.replace(/\D/g, ''))}
                placeholder="e.g. 3" />
              
              </div>
              <div className="space-y-1.5">
                <Label>Unit</Label>
                <Select value={form.interval_unit || 'Years'} onValueChange={(v) => setTermField('interval_unit', v)}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
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
              value={form.term_renewal_date || ''}
              onChange={(v) => {renewalEditedRef.current = true;set('term_renewal_date', v);}} />
            
              <p className="text-xs text-muted-foreground">Auto-calculated from appointment date and term. Admins can override to extend term expiry.</p>
            </div>
          }

        </div>

        <div className="flex justify-end gap-2 px-6 py-4 border-t border-border">
          <Button variant="outline" onClick={() => guard.requestClose()}>Cancel</Button>
          <Button onClick={() => mutation.mutate()} disabled={!user || !form.appointment_date || mutation.isPending}>
            {mutation.isPending && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
            Add Member
          </Button>
        </div>
      </div>
      {guard.dialog}
    </ModalOverlay>);

}