import React, { useState, useEffect, useRef, forwardRef, useImperativeHandle } from 'react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import PersonDetailsFields from './PersonDetailsFields';
import SectionCard from '@/components/shared/SectionCard';
import DateField from '@/components/ui/DateField';
import ColoredSelect from '@/components/shared/ColoredSelect';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import {
  updateConflict, resolveFields, calcNextReviewDate, COI_REVIEW_FREQUENCIES,
  reviewDatesRequired, isConflictOverdue, CONFLICT_TYPE_OPTIONS,
} from '@/lib/conflictOfInterest';
import FieldLabelHelp from './FieldLabelHelp';
import { useConflictScope } from '@/lib/conflictScope';
import DeclarationTitleField from '@/components/compliance/conflicts/DeclarationTitleField';
import { draftEqual } from '@/lib/unsavedChanges/draftEqual';
import { LAST_REVIEW_HELP, NEXT_REVIEW_HELP, reviewGuideText } from './reviewHelpText';

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
function FieldInput({ field, value, onChange }) {
  if (field.type === 'Single Select') {
    const opts = field.config?.options || [];
    return (
      <ColoredSelect value={value || ''} onChange={onChange} options={opts} />
    );
  }
  if (field.type === 'Date') {
    return <DateField value={value || ''} onChange={onChange} inputClassName="bg-white" />;
  }
  if (field.type === 'Long Text') {
    return (
      <textarea
        value={value || ''}
        onChange={(e) => onChange(e.target.value)}
        rows={3}
        className="w-full min-h-[72px] rounded-md border border-input bg-white px-3 py-2 text-sm outline-none resize-none focus:ring-1 focus:ring-ring placeholder:text-muted-foreground/50"
        placeholder={`Enter ${field.label.toLowerCase()}...`}
      />
    );
  }
  return (
    <Input value={value || ''} onChange={(e) => onChange(e.target.value)} className="bg-white"
      placeholder={`Enter ${field.label.toLowerCase()}...`} />
  );
}

const SECTION_LABEL = 'text-xs font-semibold text-muted-foreground uppercase tracking-wider';

/**
 * Editable overview form for a Conflict of Interest, used inside ConflictPane.
 * Exposes save(), canSave() and reset() via ref so the pane footer can drive submission;
 * reports unsaved changes through onDirtyChange.
 */
const EditConflictForm = forwardRef(function EditConflictForm(
  { conflict, people = [], allConflicts = [], config, onSaved, onDirtyChange },
  ref,
) {
  const { registerId } = useConflictScope();
  const fields = resolveFields(config);
  const customFields = fields.filter((f) => !f.system);
  const optsOf = (id) => fields.find((f) => f.id === id)?.config?.options || [];

  const [form, setForm] = useState({});
  const [idError, setIdError] = useState('');
  // Last saved values — drives the pane's dirty state and Cancel.
  const [baseline, setBaseline] = useState({});
  const reviewEditedRef = useRef(false);
  const dirty = !draftEqual(form, baseline);
  useEffect(() => { onDirtyChange?.(dirty); }, [dirty]);
  useEffect(() => () => onDirtyChange?.(false), []);

  useEffect(() => {
    const init = {
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
    };
    setForm(init); setBaseline(init);
    reviewEditedRef.current = true;
    setIdError('');
  }, [conflict?.id]);

  const set = (key, val) => setForm((f) => ({ ...f, [key]: val }));

  const selectMember = (m) => {
    setForm((f) => ({ ...f, member: m }));
  };

  const recalcReview = (freq, intervalValue, intervalUnit, baseDate) => {
    const next = calcNextReviewDate(freq, {
      baseDate: baseDate ? baseDate : new Date(),
      intervalValue,
      intervalUnit,
    });
    // Ad Hoc / unset returns null — leave the field for manual input.
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

  const canSave = () => !!form.member?.name
    && (!registerId || !!form.title?.trim()) && !!form.description?.trim() && !!form.date_of_disclosure
    && !!trimmedId && !isDuplicateId && !!form.review_frequency
    && (!datesRequired || (!!form.last_review_date && (isAdHoc || !!form.next_review_date)));

  const save = async () => {
    if (!canSave()) return false;
    if (isDuplicateId) {
      setIdError(`ID "${trimmedId}" already exists.`);
      return false;
    }
    const member = form.member;
    const customData = {};
    customFields.forEach((f) => { customData[f.id] = form[f.id] ?? ''; });
    const payload = {
      conflict_id: trimmedId,
      member_user_id: member?.user_id || '',
      member_name: member?.name || '',
      date_of_disclosure: form.date_of_disclosure || null,
      ...(registerId ? { title: form.title.trim() } : {}),
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
    await updateConflict(conflict.id, payload);
    setBaseline(form);
    onSaved?.();
    return true;
  };

  const reset = () => { setForm(baseline); setIdError(''); };

  useImperativeHandle(ref, () => ({ save, canSave, reset }));

  return (
    <div className="space-y-6">
      {/* Member Details (Board only — compliance declarations stay with their declarant) */}
      {!registerId && (
        <PersonDetailsFields
          member={form.member}
          people={people}
          onSelect={selectMember}
        />
      )}

      {/* Conflict of Interest Details */}
      <SectionCard title="Declaration Details" className="space-y-3">

        <div className="grid grid-cols-2 gap-3">
          <div>
            <Label className="mb-1 block text-xs font-medium text-muted-foreground">
              Conflict ID <span className="text-destructive">*</span>
            </Label>
            <Input
              value={form.conflict_id || ''}
              onChange={(e) => { set('conflict_id', e.target.value); if (idError) setIdError(''); }}
              placeholder="e.g. COI-001"
              className={shownIdError ? 'bg-white border-destructive focus-visible:ring-destructive' : 'bg-white'}
            />
            {shownIdError && <p className="mt-1 text-xs text-destructive">{shownIdError}</p>}
          </div>
          <div>
            <Label className="mb-1 block text-xs font-medium text-muted-foreground">
              Date of Declaration <span className="text-destructive">*</span>
            </Label>
            <DateField value={form.date_of_disclosure || ''} onChange={(v) => set('date_of_disclosure', v)} inputClassName="bg-white" />
          </div>
        </div>

        {registerId && <DeclarationTitleField value={form.title} onChange={(v) => set('title', v)} />}

        <div>
          <Label className="mb-1 block text-xs font-medium text-muted-foreground">
            Nature of Interest <span className="text-destructive">*</span>
          </Label>
          <AutoTextarea
            value={form.description || ''}
            onChange={(e) => set('description', e.target.value)}
            placeholder="e.g., a description of the personal, financial, family, or external business interest."
            rows={3}
            className="w-full min-h-[72px] rounded-md border border-input bg-white px-3 py-2 text-sm outline-none resize-none overflow-hidden focus:ring-1 focus:ring-ring placeholder:text-muted-foreground/50"
          />
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <Label className="mb-1 block text-xs font-medium text-muted-foreground">Status</Label>
            <ColoredSelect
              value={form.status || 'Open'}
              onChange={(v) => set('status', v)}
              options={optsOf('status')}
              allowClear={false}
            />
          </div>
          <div>
            <Label className="mb-1 block text-xs font-medium text-muted-foreground">Conflict Type</Label>
            <ColoredSelect
              value={form.conflict_type || ''}
              onChange={(v) => set('conflict_type', v)}
              options={CONFLICT_TYPE_OPTIONS}
            />
          </div>
          <div>
            <Label className="mb-1 block text-xs font-medium text-muted-foreground">Risk Exposure</Label>
            <ColoredSelect
              value={form.risk_exposure || ''}
              onChange={(v) => set('risk_exposure', v)}
              options={optsOf('risk_exposure')}
            />
          </div>
          <div>
            <Label className="mb-1 block text-xs font-medium text-muted-foreground">Committee Notified</Label>
            <ColoredSelect
              value={form.committee_notified || ''}
              onChange={(v) => set('committee_notified', v)}
              options={optsOf('committee_notified')}
            />
          </div>
          <div>
            <Label className="mb-1 block text-xs font-medium text-muted-foreground">Approved By</Label>
            <Input value={form.approved_by || ''} onChange={(e) => set('approved_by', e.target.value)} placeholder="Name of approver" className="bg-white" />
          </div>
          <div>
            <Label className="mb-1 block text-xs font-medium text-muted-foreground">Approved Date</Label>
            <DateField value={form.approved_date || ''} onChange={(v) => set('approved_date', v)} inputClassName="bg-white" />
          </div>
        </div>

      </SectionCard>

      {/* Review */}
      <SectionCard title="Review Details" className="space-y-3">

        {/* Frequency + both review dates on one row */}
        <div className="grid grid-cols-3 gap-3">
          <div>
            <Label className="mb-1 block text-xs font-medium text-muted-foreground">
              Review Frequency <span className="text-destructive">*</span>
            </Label>
            <Select value={form.review_frequency || ''} onValueChange={onFreqChange}>
              <SelectTrigger className="bg-white"><SelectValue placeholder="Select..." /></SelectTrigger>
              <SelectContent>
                {COI_REVIEW_FREQUENCIES.map((f) => <SelectItem key={f} value={f}>{f}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
          <div>
            <FieldLabelHelp label="Last Review Date" help={LAST_REVIEW_HELP} required={datesRequired} />
            <DateField
              value={form.last_review_date || ''}
              onChange={onLastReviewChange}
              disabled={!datesRequired}
              inputClassName="bg-white"
            />
          </div>
          <div>
            <FieldLabelHelp label="Next Review Date" help={NEXT_REVIEW_HELP} required={datesRequired && !isAdHoc} />
            <DateField
              value={form.next_review_date || ''}
              onChange={(v) => set('next_review_date', v)}
              disabled
              inputClassName="bg-white"
            />
            {isConflictOverdue({ status: form.status, next_review_date: form.next_review_date }) && (
              <p className="mt-1 text-xs text-red-600">Overdue</p>
            )}
          </div>
        </div>

        <p className="text-xs text-muted-foreground">{reviewGuideText(form.review_frequency)}</p>

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
                className="bg-white"
              />
            </div>
            <div>
              <Label className="mb-1 block text-xs font-medium text-muted-foreground">Unit</Label>
              <Select value={form.interval_unit || 'Months'} onValueChange={(v) => onIntervalChange('interval_unit', v)}>
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

      {/* Custom fields */}
      {customFields.length > 0 && (
        <SectionCard title="Additional Details" className="space-y-3">
          <div className="grid grid-cols-2 gap-3">
            {customFields.map((field) => (
              <div key={field.id} className={field.type === 'Long Text' ? 'col-span-2' : ''}>
                <Label className="mb-1 block text-xs font-medium text-muted-foreground">{field.label}</Label>
                <FieldInput field={field} value={form[field.id]} onChange={(v) => set(field.id, v)} />
              </div>
            ))}
          </div>
        </SectionCard>
      )}

    </div>
  );
});

export default EditConflictForm;