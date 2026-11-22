import React, { useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { base44 } from '@/api/base44Client';
import { useToast } from '@/components/ui/use-toast';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { parseAmount } from '@/lib/financials';
import GrantStepInfo from './steps/GrantStepInfo';
import GrantStepKeyPersonnel from './steps/GrantStepKeyPersonnel';
import GrantStepFinancials from './steps/GrantStepFinancials';
import GrantStepReview from './steps/GrantStepReview';
import CloseButton from '@/components/shared/CloseButton';

// Steps: 1=Info, 2=Key Personnel, 3=Financials, 4=Review
const STEPS = [
  { num: 1, label: 'Grant\nInformation' },
  { num: 2, label: 'Key\nPersonnel' },
  { num: 3, label: 'Financials' },
  { num: 4, label: 'Review' },
];

// Factory, not a shared constant — every init/reset gets its own nested
// arrays/objects so state can never leak between grant creation sessions.
function createEmptyForm() {
  return {
    name: '',
    reference_id: '',
    status: 'active',
    provider: '',
    provider_id: '',
    program: '',
    activity_id: '',
    internal_owner: '',
    start_date: '',
    end_date: '',
    description: '',
    provider_contacts: [{ name: '', role: '', email: '', phone: '' }],
    total_amount: '',
    // Wizard-local scratch state only — these rows become FinancialEntry
    // 'funding' records (label = Period, amount = Funding). Never a Grant field.
    funding_rows: [{ label: '', amount: '' }],
  };
}

export default function AddGrantModal({ isOpen, onClose, onSaved }) {
  const { toast } = useToast();
  const [step, setStep] = useState(1);
  const [form, setForm] = useState(createEmptyForm);
  const [saving, setSaving] = useState(false);
  const [errors, setErrors] = useState({});

  if (!isOpen) return null;

  const update = (fields) => setForm(prev => ({ ...prev, ...fields }));

  const validateStep1 = () => {
    const e = {};
    if (!form.name.trim()) e.name = 'Grant Title is required';
    if (!form.provider.trim()) e.provider = 'Grant Provider is required';
    if (!form.status) e.status = 'Status is required';
    if (!form.program.trim()) e.program = 'Grant Activity is required';
    if (!form.internal_owner.trim()) e.internal_owner = 'Grant Lead is required';
    if (!form.start_date) e.start_date = 'Start Date is required';
    if (!form.end_date) e.end_date = 'End Date is required';
    // Dates are ISO 'YYYY-MM-DD', so a string compare gives the correct ordering.
    else if (form.start_date && form.end_date < form.start_date) e.end_date = 'End Date must be after Start Date';
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const goNext = () => {
    if (step === 1 && !validateStep1()) return;
    setErrors({});
    setStep(s => Math.min(s + 1, STEPS.length));
  };

  // Numeric validation runs FIRST — the breakdown-vs-total check is only
  // meaningful once every amount is a finite, non-negative number.
  const parsedTotal = parseAmount(form.total_amount);
  const parsedRows = (form.funding_rows || []).map(r => parseAmount(r.amount));
  const hasInvalidAmounts = parsedTotal === null || parsedRows.some(a => a === null);

  const totalGrant = parsedTotal ?? 0;
  const breakdownTotal = parsedRows.reduce((sum, a) => sum + (a ?? 0), 0);
  const financialsMismatch = !hasInvalidAmounts && totalGrant > 0 && Math.abs(totalGrant - breakdownTotal) >= 0.005;

  const goBack = () => setStep(s => Math.max(s - 1, 1));
  const goToStep = (n) => {
    if (n < step) setStep(n);
    else if (n === step + 1) goNext();
  };

  const handleClose = () => {
    // A save in flight owns the modal — backdrop, X and Cancel must not reset
    // the form or close it mid-operation.
    if (saving) return;
    setStep(1);
    setForm(createEmptyForm());
    setErrors({});
    onClose();
  };

  const handleSave = async () => {
    // Hard gate — no invalid amount may ever reach the entity payload.
    if (hasInvalidAmounts) {
      toast({
        title: 'Invalid amount',
        description: 'Grant amounts must be valid, non-negative numbers.',
        variant: 'destructive',
      });
      return;
    }

    setSaving(true);
    try {
    // Funding Breakdown is the authoritative record of what was awarded, so work
    // out those rows first and derive the grant's cached total_amount from them.
    const enteredTotal = parsedTotal ?? 0;
    const breakdownRows = form.funding_rows
      .map((y, i) => ({ label: y.label, amount: parsedRows[i] ?? 0 }))
      .filter(y => y.label && y.amount > 0);
    // A grant with a total but no itemised breakdown still gets one row, so
    // Grant Detail never has to fall back to the cached summary.
    const fundingSpecs = breakdownRows.length
      ? breakdownRows
      : enteredTotal > 0 ? [{ label: 'Year 1', amount: enteredTotal }] : [];
    const fundingTotal = fundingSpecs.reduce((sum, r) => sum + r.amount, 0);

    // funding_rows is wizard-local — it must not reach the Grant payload.
    const { funding_rows: _fundingRows, ...grantFields } = form;
    const payload = {
      ...grantFields,
      total_amount: fundingSpecs.length ? fundingTotal : 0,
      provider_contacts: form.provider_contacts.filter(c => c.name || c.email),
    };
    const grant = await base44.entities.Grant.create(payload);
    const grantId = grant.id;

    if (fundingSpecs.length) {
      await base44.entities.FinancialEntry.bulkCreate(fundingSpecs.map((r, idx) => ({
        parent_type: 'grant',
        parent_id: grantId,
        type: 'funding',
        label: r.label,
        amount: r.amount,
        amount_secondary: 0,
        status: 'scheduled',
        sort_order: idx,
      })));
    }

    setStep(1);
    setForm(createEmptyForm());
    onSaved();
    } catch (err) {
      toast({ title: 'Error', description: 'Failed to create grant.', variant: 'destructive' });
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/40" onClick={handleClose} />
      <motion.div
        initial={{ opacity: 0, scale: 0.97, y: 8 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.97, y: 8 }}
        transition={{ duration: 0.18, ease: [0.16, 1, 0.3, 1] }}
        className="relative z-10 bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] flex flex-col"
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 pt-6 pb-4 shrink-0">
          <h2 className="text-xl font-bold text-foreground">Add New Grant</h2>
          <CloseButton onClick={handleClose} />
        </div>

        {/* Step indicator */}
        <div className="px-6 pb-5 shrink-0">
          <div className="flex items-start gap-2">
            {STEPS.map((s, i) => {
              const done = step > s.num;
              const active = step === s.num;
              return (
                <React.Fragment key={s.num}>
                  <button
                    onClick={() => goToStep(s.num)}
                    className="flex flex-col items-center gap-1.5 min-w-0"
                    style={{ flex: 1 }}
                  >
                    <div className={cn(
                      'w-9 h-9 rounded-full flex items-center justify-center text-sm font-bold transition-all border-2',
                      active ? 'bg-primary text-white border-primary' :
                      done ? 'bg-primary/20 text-primary border-primary/30' :
                      'bg-white text-muted-foreground border-border'
                    )}>
                      {s.num}
                    </div>
                    <span className={cn(
                      'text-xs text-center whitespace-pre-line leading-tight',
                      active ? 'text-primary font-semibold' : 'text-muted-foreground'
                    )}>{s.label}</span>
                  </button>
                  {i < STEPS.length - 1 && (
                    <div className={cn('flex-1 h-0.5 mt-4 rounded-full transition-colors', done ? 'bg-primary/40' : 'bg-border')} />
                  )}
                </React.Fragment>
              );
            })}
          </div>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto px-6 pb-4">
          {step === 1 && <GrantStepInfo form={form} update={update} errors={errors} />}
          {step === 2 && <GrantStepKeyPersonnel form={form} update={update} />}
          {step === 3 && <GrantStepFinancials form={form} update={update} />}
          {step === 4 && <GrantStepReview form={form} />}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between px-6 py-4 border-t border-border shrink-0">
          <Button variant="outline" onClick={handleClose} disabled={saving}>Cancel</Button>
          <div className="flex items-center gap-2">
            {step > 1 && <Button variant="outline" onClick={goBack}>Back</Button>}
            {step < STEPS.length ? (
              <Button
                onClick={goNext}
                disabled={step === 3 && (financialsMismatch || hasInvalidAmounts)}
                className="bg-primary text-white hover:bg-primary/90"
              >
                Next Step
              </Button>
            ) : (
              <Button onClick={handleSave} disabled={saving || hasInvalidAmounts} className="bg-primary text-white hover:bg-primary/90">
                {saving ? 'Saving...' : 'Save & Create Grant'}
              </Button>
            )}
          </div>
        </div>
      </motion.div>
    </div>
  );
}