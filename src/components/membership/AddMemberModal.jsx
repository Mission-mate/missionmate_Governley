import React, { useState, useEffect, useMemo } from 'react';
import { format } from 'date-fns';
import MotionModal from '@/components/shared/MotionModal';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from
'@/components/ui/select';
import DateField from '@/components/ui/DateField';
import { useToast } from '@/components/ui/use-toast';
import { base44 } from '@/api/base44Client';
import { MEMBER_STATUSES, calculateExpirationDate } from '@/lib/membership';
import TagPicker from '@/components/shared/tags/TagPicker';
import MemberStatusPill from '@/components/membership/MemberStatusPill';
import useUnsavedChanges from '@/hooks/useUnsavedChanges';
import { pickFields } from '@/lib/unsavedChanges/pickFields';

const today = () => format(new Date(), 'yyyy-MM-dd');

const emptyForm = () => ({
  first_name: '', last_name: '', email: '', phone: '',
  membership_structure_id: '', membership_tier_id: '', status: 'active',
  start_date: today(), expiration_date: '', tags: []
});

// Expiration is derived from plan + start date, so it never counts as an edit.
const SELECT = pickFields(emptyForm(), ['expiration_date']);

export default function AddMemberModal({ isOpen, onClose, onSaved, structures = [], tags = [] }) {
  const { toast } = useToast();
  const [form, setForm] = useState(emptyForm());
  const [saving, setSaving] = useState(false);

  useEffect(() => {if (isOpen) setForm(emptyForm());}, [isOpen]);

  const selectedStructure = useMemo(
    () => structures.find((s) => s.id === form.membership_structure_id) || null,
    [structures, form.membership_structure_id]
  );
  const isLifetime = !!selectedStructure?.is_lifetime;
  const tiers = selectedStructure?.has_tiers ? selectedStructure.tiers || [] : [];
  const selectedTier = tiers.find((t) => t.id === form.membership_tier_id) || null;

  // Auto-calculate expiration date when structure or start date changes.
  useEffect(() => {
    if (!selectedStructure) return;
    setForm((f) => ({ ...f, expiration_date: calculateExpirationDate(f.start_date, selectedStructure) }));
  }, [selectedStructure, form.start_date]);

  const set = (key) => (e) => setForm((f) => ({ ...f, [key]: e.target.value }));

  const handleSave = async () => {
    if (!form.first_name.trim()) {toast({ title: 'First name is required', variant: 'destructive' });return;}
    if (!form.membership_structure_id) {toast({ title: 'Membership plan is required', variant: 'destructive' });return;}
    if (tiers.length > 0 && !form.membership_tier_id) {toast({ title: 'Tier is required for this plan', variant: 'destructive' });return;}
    try {
      setSaving(true);
      await base44.entities.Member.create({
        first_name: form.first_name.trim(),
        last_name: form.last_name.trim(),
        email: form.email.trim(),
        phone: form.phone.trim(),
        membership_structure_id: form.membership_structure_id,
        membership_structure_name: selectedStructure?.name || '',
        membership_tier_id: selectedTier?.id || '',
        membership_tier_name: selectedTier?.name || '',
        status: form.status,
        tags: form.tags,
        start_date: form.start_date,
        expiration_date: isLifetime ? '' : form.expiration_date,
        custom_fields: {}
      });
      toast({ title: 'Member added' });
      await onSaved();
      onClose();
    } catch {
      toast({ title: 'Error', description: 'Failed to add member.', variant: 'destructive' });
    } finally {
      setSaving(false);
    }
  };

  const baseline = useMemo(() => emptyForm(), [isOpen]);
  const guard = useUnsavedChanges({
    draft: form,
    baseline,
    select: SELECT,
    onClose,
    saving,
    enabled: isOpen,
  });

  return (
    <MotionModal
      isOpen={isOpen}
      onClose={() => guard.requestClose()}
      title="Add Member"
      footer={
        <>
          <Button variant="outline" onClick={() => guard.requestClose()} disabled={saving}>Cancel</Button>
          <Button onClick={handleSave} disabled={saving} className="bg-primary text-white hover:bg-primary/90">
            {saving ? 'Adding...' : 'Add Member'}
          </Button>
        </>
      }
    >
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <Label className="mb-1.5 block text-sm">First Name <span className="text-destructive">*</span></Label>
            <Input value={form.first_name} onChange={set('first_name')} placeholder="e.g., Jane" />
          </div>
          <div>
            <Label className="mb-1.5 block text-sm">Last Name</Label>
            <Input value={form.last_name} onChange={set('last_name')} placeholder="e.g., Doe" />
          </div>
          <div>
            <Label className="mb-1.5 block text-sm">Email</Label>
            <Input type="email" value={form.email} onChange={set('email')} placeholder="e.g., Jane.doe@missionfoundation.com" />
          </div>
          <div>
            <Label className="mb-1.5 block text-sm">Contact Number</Label>
            <Input value={form.phone} onChange={set('phone')} placeholder="e.g., 0412 345 678" />
          </div>
          <div>
            <Label className="mb-1.5 block text-sm">Membership Plan <span className="text-destructive">*</span></Label>
            <Select value={form.membership_structure_id} onValueChange={(v) => setForm((f) => ({ ...f, membership_structure_id: v, membership_tier_id: '' }))}>
              <SelectTrigger><SelectValue placeholder="Select a membership plan" /></SelectTrigger>
              <SelectContent>
                {structures.map((s) =>
                <SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>
                )}
              </SelectContent>
            </Select>
          </div>
          {tiers.length > 0 &&
          <div>
            <Label className="mb-1.5 block text-sm">Tier <span className="text-destructive">*</span></Label>
            <Select value={form.membership_tier_id} onValueChange={(v) => setForm((f) => ({ ...f, membership_tier_id: v }))}>
              <SelectTrigger><SelectValue placeholder="Select a tier" /></SelectTrigger>
              <SelectContent>
                {tiers.map((t) =>
                <SelectItem key={t.id} value={t.id}>{t.name}</SelectItem>
                )}
              </SelectContent>
            </Select>
          </div>
          }
          <div>
            <Label className="mb-1.5 block text-sm">Membership Status</Label>
            <Select value={form.status} onValueChange={(v) => setForm((f) => ({ ...f, status: v }))}>
              <SelectTrigger>
                <SelectValue asChild><MemberStatusPill status={form.status} /></SelectValue>
              </SelectTrigger>
              <SelectContent>
                {MEMBER_STATUSES.map((s) =>
                <SelectItem key={s.value} value={s.value}><MemberStatusPill status={s.value} /></SelectItem>
                )}
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label className="mb-1.5 block text-sm">Start Date</Label>
            <DateField value={form.start_date} onChange={(v) => setForm((f) => ({ ...f, start_date: v }))} />
          </div>
          <div>
            <Label className="mb-1.5 block text-sm">Expiration Date</Label>
            <Input
              value={isLifetime ? 'Never' : form.expiration_date ? format(new Date(form.expiration_date), 'dd MMM yyyy') : ''}
              disabled
              className="bg-muted text-muted-foreground" />
            {isLifetime && <p className="text-xs text-muted-foreground mt-1">Lifetime membership — never expires.</p>}
          </div>
          <div className="sm:col-span-2">
            <Label className="mb-1.5 block text-sm">Tags</Label>
            <TagPicker value={form.tags} onChange={(v) => setForm((f) => ({ ...f, tags: v }))} />
          </div>
        </div>
        {guard.dialog}
    </MotionModal>);

}