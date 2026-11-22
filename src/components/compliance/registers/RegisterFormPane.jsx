import React, { useState, useEffect } from 'react';
import { guardSave } from '@/lib/saveGuard';
import { Loader2 } from 'lucide-react';
import PaneIconHeaderActions from '@/components/shared/PaneIconHeaderActions';
import { Button } from '@/components/ui/button';
import SlidePane from '@/components/ui/SlidePane';
import RegisterDetailFields from './RegisterDetailFields';
import StepIndicator from './StepIndicator';
import RegisterTypeStep from './RegisterTypeStep';
import useUnsavedChanges from '@/hooks/useUnsavedChanges';
import useFieldErrors from '@/hooks/useFieldErrors';
import FieldError from '@/components/shared/FieldError';

const registerTypeErrors = (f) => (f.register_type ? {} : { register_type: 'Select a register from the library.' });
const registerDetailErrors = (f) => Object.fromEntries(Object.entries({
  title: !f.title.trim() && 'Register title is required.',
  category: !f.category && 'Category is required.',
  owner: !f.owner.trim() && 'Owner is required.',
}).filter(([, v]) => v));
import {
  calcNextReviewDate, createRegister, updateRegister, todayISO,
} from '@/lib/complianceRegisters';

const emptyForm = (category) => ({
  title: '', category: category || '', owner: '',
  review_frequency: '', interval_value: 1, interval_unit: 'Months',
  last_review_date: todayISO(), next_review_date: '', status: 'active',
  register_type: '',
});

export default function RegisterFormPane({ isOpen, onClose, onSaved, categories, register }) {
  const isEdit = !!register;
  const [form, setForm] = useState(emptyForm());
  const [step, setStep] = useState(1);
  const [maxStep, setMaxStep] = useState(1);
  const [saving, setSaving] = useState(false);
  const [baseline, setBaseline] = useState(form);
  const fe = useFieldErrors((f) => ({ ...registerTypeErrors(f), ...registerDetailErrors(f) }), form);
  const setInitial = (init) => { setForm(init); setBaseline(init); };
  const { requestClose, dialog } = useUnsavedChanges({
    draft: form, baseline, onClose, saving, enabled: isOpen, subject: 'register changes',
  });

  useEffect(() => {
    if (!isOpen) return;
    fe.reset(); setStep(1); setMaxStep(1); setSaving(false);
    if (register) {
      setInitial({
        title: register.title || '',
        category: register.category || '',
        owner: register.owner || '',
        review_frequency: register.review_frequency || '',
        interval_value: register.interval_value || 1,
        interval_unit: register.interval_unit || 'Months',
        last_review_date: register.last_review_date || '',
        next_review_date: register.next_review_date || '',
        status: register.status || 'active',
        register_type: register.register_type || '',
      });
    } else {
      setInitial(emptyForm(categories[0]));
    }
  }, [isOpen, register]); // eslint-disable-line

  const set = (k, v) => setForm((f) => ({ ...f, [k]: v }));

  const recalc = (next) => {
    if (next.review_frequency === 'Ad Hoc' || !next.review_frequency) return next;
    const calculated = calcNextReviewDate(next.review_frequency, {
      baseDate: next.last_review_date || new Date(),
      intervalValue: next.interval_value,
      intervalUnit: next.interval_unit,
    });
    return { ...next, next_review_date: calculated || '' };
  };

  const review = {
    onFrequency: (v) => setForm((f) => {
      // Ad Hoc clears both dates so they can be entered manually
      if (v === 'Ad Hoc') return { ...f, review_frequency: v, last_review_date: '', next_review_date: '' };
      const base = { ...f, review_frequency: v, last_review_date: f.last_review_date || todayISO() };
      return recalc(base);
    }),
    onIntervalValue: (v) => setForm((f) => recalc({ ...f, interval_value: v })),
    onIntervalUnit: (v) => setForm((f) => recalc({ ...f, interval_unit: v })),
    onLastReviewChange: (v) => setForm((f) => recalc({ ...f, last_review_date: v })),
  };

  const handleSave = guardSave(setSaving, async () => {
    if (!fe.check(registerDetailErrors)) return;
    setSaving(true);
    const created = isEdit ? null : await createRegister(form);
    if (isEdit) await updateRegister(register.id, form);
    setBaseline(form);
    setSaving(false);
    onSaved(created); onClose();
  });

  const handleContinue = () => {
    if (!fe.check(registerTypeErrors)) return;
    setStep(2); setMaxStep(2);
  };

  return (
    <>
    {dialog}
    <SlidePane isOpen={isOpen} onClose={requestClose}>
      <div className="bg-card h-full flex flex-col shadow-2xl">
        <div className="flex items-center justify-between px-6 py-5 border-b border-border shrink-0">
          <h2 className="text-lg font-bold text-foreground">{isEdit ? 'Edit Register' : 'Add New Register'}</h2>
          <PaneIconHeaderActions showEdit={false} onClose={() => requestClose()} />
        </div>

        <div className="px-6 py-5 flex-1 overflow-y-auto">
          {!isEdit && <StepIndicator step={step} maxStep={maxStep} onGoTo={setStep} />}

          {(isEdit || step === 2) && (
            <>
              <RegisterDetailFields form={form} set={set} categories={categories} review={review} errors={fe.errors} />
            </>
          )}

          {!isEdit && step === 1 && (
            <>
              <RegisterTypeStep value={form.register_type} onSelect={(v) => set('register_type', v)} />
              <FieldError msg={fe.errors.register_type} />
            </>
          )}
        </div>

        <div className="flex items-center justify-between gap-3 px-6 py-4 border-t border-border shrink-0">
          <div>
            {!isEdit && step > 1 && <Button variant="outline" onClick={() => setStep(step - 1)}>Back</Button>}
          </div>
          <div className="flex items-center gap-3">
            <Button variant="outline" onClick={() => requestClose()}>Cancel</Button>
            {isEdit ? (
              <Button onClick={handleSave} disabled={saving}>
                {saving ? <><Loader2 className="w-4 h-4 animate-spin" /> Saving...</> : 'Save Changes'}
              </Button>
            ) : step === 1 ? (
              <Button onClick={handleContinue}>Continue</Button>
            ) : (
              <Button onClick={handleSave} disabled={saving}>
                {saving ? <><Loader2 className="w-4 h-4 animate-spin" /> Adding...</> : 'Add Register'}
              </Button>
            )}
          </div>
        </div>
      </div>
    </SlidePane>
    </>
  );
}