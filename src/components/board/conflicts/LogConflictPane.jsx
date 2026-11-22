import React, { useState, useEffect, useRef } from 'react';
import PaneIconHeaderActions from '@/components/shared/PaneIconHeaderActions';
import SlidePane from '@/components/ui/SlidePane';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import PersonDetailsFields from './PersonDetailsFields';
import SectionCard from '@/components/shared/SectionCard';
import DateField from '@/components/ui/DateField';
import {
  createConflict, updateConflict, resolveFields, nextConflictId,
  calcNextReviewDate, COI_REVIEW_FREQUENCIES, reviewDatesRequired, CONFLICT_TYPE_OPTIONS,
} from '@/lib/conflictOfInterest';
import FieldLabelHelp from './FieldLabelHelp';
import { useConflictScope } from '@/lib/conflictScope';
import DeclarationTitleField from '@/components/compliance/conflicts/DeclarationTitleField';



import { LAST_REVIEW_HELP, NEXT_REVIEW_HELP, reviewGuideText } from './reviewHelpText';
import ColoredSelect from '@/components/shared/ColoredSelect';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { cn } from '@/lib/utils';
import useUnsavedChanges from '@/hooks/useUnsavedChanges';
import { localToday } from '@/lib/localClock';

function AutoTextarea({ value, ...props }) {
  const ref = useRef(null);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    el.style.height = 'auto';
    el.style.height = `${el.scrollHeight}px`;
  }, [value]);
  return <textarea ref={ref} value={value} {...props} />;
}

// Generic input for custom (non-system) fields
function FieldInput({ field, value, onChange, readOnly }) {
  if (field.type === 'Single Select') {
    const opts = field.config?.options || [];
    return (
      <ColoredSelect value={value || ''} onChange={onChange} options={opts} disabled={readOnly} />
    );
  }
  if (field.type === 'Date') {
    return <DateField value={value || ''} onChange={onChange} disabled={readOnly} inputClassName="bg-white" />;
  }
  if (field.type === 'Long Text') {
    return (
      <textarea
        value={value || ''}
        onChange={(e) => onChange(e.target.value)}
        rows={3}
        disabled={readOnly}
        className="w-full min-h-[72px] rounded-md border border-input bg-white px-3 py-2 text-sm outline-none resize-none focus:ring-1 focus:ring-ring placeholder:text-muted-foreground/50 disabled:opacity-70"
        placeholder={`Enter ${field.label.toLowerCase()}...`}
      />
    );
  }
  return (
    <Input value={value || ''} onChange={(e) => onChange(e.target.value)} disabled={readOnly} className="bg-white"
      placeholder={`Enter ${field.label.toLowerCase()}...`} />
  );
}

const SECTION_LABEL = 'text-xs font-semibold text-muted-foreground uppercase tracking-wider';

export default function LogConflictPane({ conflict, people = [], allConflicts = [], config, onClose, onSaved, readOnly = false }) {
  // Compliance: declarations are always logged from a declarant's profile, so the person is fixed.
  const { registerId, declarant } = useConflictScope();
  const isEdit = !!conflict;
  const isCompliance = !!registerId;
  const noun = isCompliance ? 'Declaration' : 'Conflict of Interest';
  const fields = resolveFields(config);
  const customFields = fields.filter(f => !f.system);
  const optsOf = (id) => fields.find((f) => f.id === id)?.config?.options || [];

  const [form, setForm] = useState({});
  const [saving, setSaving] = useState(false);
  const [idError, setIdError] = useState('');
  // Track manual edits to next review date so auto-calc doesn't override
  const reviewEditedRef = useRef(false);
  const [baseline, setBaseline] = useState({});
  const setInitial = (init) => { setForm(init); setBaseline(init); };

  const { requestClose, dialog } = useUnsavedChanges({
    draft: form, baseline, onClose, saving, enabled: !readOnly, subject: 'conflict changes',
  });

  useEffect(() => {
    if (conflict) {
      setInitial({
        conflict_id: conflict.conflict_id || '',
        member: conflict.member_name
          ? { user_id: conflict.member_user_id || '', name: conflict.member_name }
          : null,
        date_of_disclosure: conflict.date_of_disclosure || '',
        title: conflict.title || '',
        description: conflict.description || '',
        committee_notified: conflict.committee_notified || '',
        status: conflict.status || 'Open',
        review_frequency: conflict.review_frequency || '',
        interval_value: conflict.interval_value || '',
        interval_unit: conflict.interval_unit || 'Months',
        last_review_date: conflict.last_review_date || '',
        next_review_date: conflict.next_review_date || '',
        risk_exposure: conflict.risk_exposure || '',
        approved_by: conflict.approved_by || '',
        conflict_type: conflict.conflict_type || '',
        approved_date: conflict.approved_date || '',
        ...(conflict.custom_fields || {}),
      });
      reviewEditedRef.current = true;
    } else {
      setInitial({ conflict_id: nextConflictId(allConflicts), member: declarant || null, status: 'Open', interval_unit: 'Months', last_review_date: localToday() });
      reviewEditedRef.current = false;
    }
    setIdError('');
  }, [conflict?.id]);

  const set = (key, val) => setForm((f) => ({ ...f, [key]: val }));

  const selectMember = (m) => {
    setForm((f) => ({ ...f, member: m }));
  };

  // Auto-calculate next review date from the last review date + frequency.
  // Ad Hoc (and unset) has no auto date — the user enters it manually.
  const recalcReview = (freq, intervalValue, intervalUnit, baseDate) => {
    const next = calcNextReviewDate(freq, {
      baseDate: baseDate ? baseDate : new Date(),
      intervalValue,
      intervalUnit,
    });
    // calcNextReviewDate returns null for Ad Hoc / unset — leave the field for manual input.
    if (next) set('next_review_date', next);
  };

  const onFreqChange = (freq) => {
    // 'Not Required' clears both review dates — the record saves without them.
    if (freq === 'Not Required') {
      setForm((f) => ({ ...f, review_frequency: freq, last_review_date: '', next_review_date: '' }));
      return;
    }
    setForm((f) => ({ ...f, review_frequency: freq, ...(freq === 'Ad Hoc' ? { next_review_date: '' } : {}) }));
    recalcReview(freq, form.interval_value, form.interval_unit, form.last_review_date);
  };

  const onIntervalChange = (key, val) => {
    setForm((f) => ({ ...f, [key]: val }));
    const iv = key === 'interval_value' ? val : form.interval_value;
    const iu = key === 'interval_unit' ? val : form.interval_unit;
    recalcReview(form.review_frequency, iv, iu, form.last_review_date);
  };

  const onLastReviewChange = (val) => {
    set('last_review_date', val);
    recalcReview(form.review_frequency, form.interval_value, form.interval_unit, val);
  };

  const isAdHoc = form.review_frequency === 'Ad Hoc';
  const datesRequired = reviewDatesRequired(form.review_frequency);

  // Live duplicate-ID check — shown as the user types, before any save attempt.
  const trimmedId = (form.conflict_id || '').trim();
  const isDuplicateId = !!trimmedId
    && allConflicts.some((c) => c.conflict_id === trimmedId && c.id !== conflict?.id);
  const shownIdError = idError || (isDuplicateId ? `ID "${trimmedId}" already exists.` : '');

  const canSave = !!form.member?.name && (!isCompliance || !!form.title?.trim()) && !!form.description?.trim() && !!form.date_of_disclosure
    && !!trimmedId && !isDuplicateId && !!form.review_frequency
    && (!datesRequired || (!!form.last_review_date && (isAdHoc || !!form.next_review_date)));

  const handleSave = async () => {
    if (!canSave) return;
    if (isDuplicateId) {
      setIdError(`ID "${trimmedId}" already exists.`);
      return;
    }
    setSaving(true);
    const member = form.member;
    const customData = {};
    customFields.forEach((f) => { customData[f.id] = form[f.id] ?? ''; });
    const payload = {
      conflict_id: trimmedId,
      member_user_id: member?.user_id || '',
      member_name: member?.name || '',
      date_of_disclosure: form.date_of_disclosure || null,
      ...(isCompliance ? { title: form.title.trim() } : {}),
      description: form.description.trim(),
      committee_notified: form.committee_notified || '',
      status: form.status || 'Open',
      review_frequency: form.review_frequency || '',
      interval_value: form.review_frequency === 'Every' ? (Number(form.interval_value) || null) : null,
      interval_unit: form.review_frequency === 'Every' ? (form.interval_unit || 'Months') : null,
      last_review_date: form.last_review_date || null,
      next_review_date: form.next_review_date || null,
      risk_exposure: form.risk_exposure || '',
      approved_by: form.approved_by?.trim() || '',
      conflict_type: form.conflict_type || '',
      approved_date: form.approved_date || null,
      custom_fields: customData,
    };
    if (isEdit) await updateConflict(conflict.id, payload);
    else await createConflict({ ...payload, register_status: 'active', ...(registerId ? { register_id: registerId } : {}) });
    setSaving(false);
    onSaved();
    onClose();
  };

  return (
    <>
    {dialog}
    <SlidePane isOpen onClose={requestClose}>
      <div
        className="h-full bg-white border-l border-border shadow-2xl flex flex-col overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
          {/* Header */}
          <div className="flex items-center justify-between px-5 py-4 border-b border-border shrink-0">
            <h2 className="text-base font-semibold text-foreground">
              {readOnly ? `View ${noun}` : isEdit ? `Edit ${noun}` : isCompliance ? 'Add Declaration' : 'Log New Conflict of Interest'}
            </h2>
            <PaneIconHeaderActions showEdit={false} onClose={() => requestClose()} />
          </div>

          {/* Content */}
          <div className="flex-1 overflow-y-auto px-5 py-4 space-y-6">
            {/* Member Details (Board only — compliance declarations belong to the open declarant) */}
            {!isCompliance && (
              <PersonDetailsFields
                member={form.member}
                people={people}
                onSelect={selectMember}
                readOnly={readOnly}
              />
            )}

            {/* Details */}
            <SectionCard title="Declaration Details" className="space-y-3">

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label className="mb-1 block text-xs font-medium text-muted-foreground">
                    Conflict ID {!readOnly && <span className="text-destructive">*</span>}
                  </Label>
                  <Input
                    value={form.conflict_id || ''}
                    onChange={(e) => { set('conflict_id', e.target.value); if (idError) setIdError(''); }}
                    placeholder="e.g. COI-001"
                    disabled={readOnly}
                    className={cn('bg-white', shownIdError && 'border-destructive focus-visible:ring-destructive')}
                  />
                  {shownIdError && <p className="mt-1 text-xs text-destructive">{shownIdError}</p>}
                </div>
                <div>
                  <Label className="mb-1 block text-xs font-medium text-muted-foreground">
                    Date of Declaration {!readOnly && <span className="text-destructive">*</span>}
                  </Label>
                  <DateField value={form.date_of_disclosure || ''} onChange={(v) => set('date_of_disclosure', v)} disabled={readOnly} inputClassName="bg-white" />
                </div>
              </div>

              {isCompliance && <DeclarationTitleField value={form.title} onChange={(v) => set('title', v)} readOnly={readOnly} />}

              <div>
                <Label className="mb-1 block text-xs font-medium text-muted-foreground">
                  Nature of Interest {!readOnly && <span className="text-destructive">*</span>}
                </Label>
                <AutoTextarea
                  value={form.description || ''}
                  onChange={(e) => set('description', e.target.value)}
                  placeholder="e.g., a description of the personal, financial, family, or external business interest."
                  rows={3}
                  disabled={readOnly}
                  className="w-full min-h-[72px] rounded-md border border-input bg-white px-3 py-2 text-sm outline-none resize-none overflow-hidden focus:ring-1 focus:ring-ring placeholder:text-muted-foreground/50 disabled:opacity-70"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label className="mb-1 block text-xs font-medium text-muted-foreground">Status</Label>
                  <ColoredSelect
                    value={form.status || 'Open'}
                    onChange={(v) => set('status', v)}
                    options={optsOf('status')}
                    disabled={readOnly}
                    allowClear={false}
                  />
                </div>
                <div>
                  <Label className="mb-1 block text-xs font-medium text-muted-foreground">Conflict Type</Label>
                  <ColoredSelect
                    value={form.conflict_type || ''}
                    onChange={(v) => set('conflict_type', v)}
                    options={CONFLICT_TYPE_OPTIONS}
                    disabled={readOnly}
                  />
                </div>
                <div>
                  <Label className="mb-1 block text-xs font-medium text-muted-foreground">Risk Exposure</Label>
                  <ColoredSelect
                    value={form.risk_exposure || ''}
                    onChange={(v) => set('risk_exposure', v)}
                    options={optsOf('risk_exposure')}
                    disabled={readOnly}
                  />
                </div>
                <div>
                  <Label className="mb-1 block text-xs font-medium text-muted-foreground">Committee Notified</Label>
                  <ColoredSelect
                    value={form.committee_notified || ''}
                    onChange={(v) => set('committee_notified', v)}
                    options={optsOf('committee_notified')}
                    disabled={readOnly}
                  />
                </div>
                <div>
                  <Label className="mb-1 block text-xs font-medium text-muted-foreground">Approved By</Label>
                  <Input value={form.approved_by || ''} onChange={(e) => set('approved_by', e.target.value)} disabled={readOnly} placeholder="Name of approver" className="bg-white" />
                </div>
                <div>
                  <Label className="mb-1 block text-xs font-medium text-muted-foreground">Approved Date</Label>
                  <DateField value={form.approved_date || ''} onChange={(v) => set('approved_date', v)} disabled={readOnly} inputClassName="bg-white" />
                </div>
              </div>

            </SectionCard>

            {/* Review */}
            <SectionCard title="Review Details" className="space-y-3">

              {/* Frequency + both review dates on one row */}
              <div className="grid grid-cols-3 gap-3">
                <div>
                  <Label className="mb-1 block text-xs font-medium text-muted-foreground">
                    Review Frequency {!readOnly && <span className="text-destructive">*</span>}
                  </Label>
                  <Select value={form.review_frequency || ''} onValueChange={onFreqChange} disabled={readOnly}>
                    <SelectTrigger className="bg-white"><SelectValue placeholder="Select..." /></SelectTrigger>
                    <SelectContent>
                      {COI_REVIEW_FREQUENCIES.map((f) => <SelectItem key={f} value={f}>{f}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <FieldLabelHelp label="Last Review Date" help={LAST_REVIEW_HELP} required={!readOnly && datesRequired} />
                  <DateField
                    value={form.last_review_date || ''}
                    onChange={onLastReviewChange}
                    disabled={readOnly || !datesRequired}
                    inputClassName="bg-white"
                  />
                </div>
                <div>
                  <FieldLabelHelp label="Next Review Date" help={NEXT_REVIEW_HELP} required={!readOnly && datesRequired && !isAdHoc} />
                  <DateField
                    value={form.next_review_date || ''}
                    onChange={(v) => set('next_review_date', v)}
                    disabled
                    inputClassName="bg-white"
                  />
                </div>
              </div>

              <p className="text-xs text-muted-foreground">{reviewGuideText(form.review_frequency)}</p>

              {/* Custom interval — only when "Every" is selected */}
              {form.review_frequency === 'Every' && (
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <Label className="mb-1 block text-xs font-medium text-muted-foreground">Every</Label>
                    <Input
                      type="number"
                      min="1"
                      value={form.interval_value || ''}
                      onChange={(e) => onIntervalChange('interval_value', e.target.value)}
                      placeholder="e.g. 4"
                      disabled={readOnly}
                      className="bg-white"
                    />
                  </div>
                  <div>
                    <Label className="mb-1 block text-xs font-medium text-muted-foreground">Unit</Label>
                    <Select value={form.interval_unit || 'Months'} onValueChange={(v) => onIntervalChange('interval_unit', v)} disabled={readOnly}>
                      <SelectTrigger className="bg-white"><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Months">Months</SelectItem>
                        <SelectItem value="Years">Years</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              )}
            </SectionCard>

            {/* Custom fields (from Configure Fields) */}
            {customFields.length > 0 && (
              <SectionCard title="Additional Details" className="space-y-3">
                <div className="grid grid-cols-2 gap-3">
                  {customFields.map((field) => (
                    <div key={field.id} className={field.type === 'Long Text' ? 'col-span-2' : ''}>
                      <Label className="mb-1 block text-xs font-medium text-muted-foreground">{field.label}</Label>
                      <FieldInput field={field} value={form[field.id]} onChange={(v) => set(field.id, v)} readOnly={readOnly} />
                    </div>
                  ))}
                </div>
              </SectionCard>
            )}
          </div>

          {/* Footer */}
          <div className="px-5 py-4 border-t border-border flex items-center justify-end gap-3 shrink-0">
            {readOnly ? (
              <Button variant="outline" onClick={onClose} className="ml-auto">Close</Button>
            ) : (
              <>
                <Button variant="outline" onClick={() => requestClose()}>Cancel</Button>
                <Button onClick={handleSave} disabled={saving || !canSave}>
                  {saving ? 'Saving...' : isEdit ? 'Save Changes' : isCompliance ? 'Add Declaration' : 'Log Conflict'}
                </Button>
              </>
            )}
          </div>
      </div>
    </SlidePane>
    </>
  );
}