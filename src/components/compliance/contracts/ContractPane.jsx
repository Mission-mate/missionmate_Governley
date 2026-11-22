import React, { useState, useEffect } from 'react';
import { guardSave } from '@/lib/saveGuard';
import { Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import SlidePane from '@/components/ui/SlidePane';
import PaneIconHeaderActions from '@/components/shared/PaneIconHeaderActions';
import useUnsavedChanges from '@/hooks/useUnsavedChanges';
import useFieldErrors from '@/hooks/useFieldErrors';
import { emptyContract, nextContractCode, contractDetailErrors, financialErrors, contractFieldErrors, contractCodeErrors, createContract, getContractTypes } from '@/lib/contractRegister';
import ContractSections from './ContractSections';
import ContractFinancials from './ContractFinancials';
import ContractStepper, { CONTRACT_STEPS } from './ContractStepper';

const LAST_STEP = CONTRACT_STEPS.length;

/** Staged Add Contract wizard. Existing contracts open on their own detail page. */
export default function ContractPane({ isOpen, onClose, register, onSaved }) {
  const [form, setForm] = useState(emptyContract());
  const [baseline, setBaseline] = useState(form);
  const [step, setStep] = useState(1);
  const [maxStep, setMaxStep] = useState(1);

  const [saving, setSaving] = useState(false);
  const { requestClose, dialog } = useUnsavedChanges({ draft: form, baseline, onClose, saving, enabled: isOpen, subject: 'contract changes' });
  const fe = useFieldErrors(contractFieldErrors, form);

  useEffect(() => {
    if (!isOpen) return;
    const init = emptyContract();
    setForm(init); setBaseline(init); setStep(1); setMaxStep(1); fe.reset(); setSaving(false);
    nextContractCode(register.id).then((code) => {
      setForm((f) => ({ ...f, contract_code: f.contract_code || code }));
      setBaseline((b) => ({ ...b, contract_code: code }));
    });
  }, [isOpen]); // eslint-disable-line

  // Details step: sync field checks, then the server-side reference uniqueness check.
  const checkDetails = async () => {
    if (!fe.check(contractDetailErrors)) return false;
    setSaving(true);
    const dup = await contractCodeErrors(register.id, form);
    setSaving(false);
    if (Object.keys(dup).length) { fe.addErrors(dup); return false; }
    return true;
  };

  const goTo = (n) => setStep(n);
  const next = guardSave(setSaving, async () => {
    if (step === 1 && !(await checkDetails())) return;
    if (step === 2 && !fe.check(financialErrors)) return;
    const n = step + 1;
    setStep(n); setMaxStep((m) => Math.max(m, n));
  }, 'Could not check the contract details');

  const handleSave = guardSave(setSaving, async () => {
    if (!(await checkDetails())) { setStep(1); return; }
    if (!fe.check(financialErrors)) { setStep(2); return; }
    setSaving(true);
    await createContract(register.id, form);
    await onSaved();
    setBaseline(form); setSaving(false);
    onClose();
  });

  const spin = <Loader2 className="w-4 h-4 animate-spin" />;

  return (
    <>
      {dialog}
      <SlidePane isOpen={isOpen} onClose={requestClose}>
        <div className="bg-card h-full flex flex-col shadow-2xl">
          <div className="px-6 py-4 border-b border-border shrink-0">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-bold text-foreground truncate">Add Contract</h2>
              <PaneIconHeaderActions showEdit={false} onClose={() => requestClose()} />
            </div>
            <div className="mt-5"><ContractStepper step={step} maxStep={maxStep} onGoTo={goTo} /></div>
          </div>
          <div className="flex-1 overflow-y-auto px-6 py-5 space-y-4">
            {step === 1 && <ContractSections values={form} setForm={setForm} edit typeOptions={getContractTypes(register)} errors={fe.errors} />}
            {step === 2 && <ContractFinancials values={form} setForm={setForm} edit errors={fe.errors} />}
          </div>
          <div className="flex items-center justify-between gap-3 px-6 py-4 border-t border-border shrink-0">
            <Button variant="outline" onClick={() => (step === 1 ? requestClose() : goTo(step - 1))}>{step === 1 ? 'Cancel' : 'Back'}</Button>
            {step < LAST_STEP
              ? <Button onClick={next} disabled={saving}>{saving ? spin : null} Next</Button>
              : <Button onClick={handleSave} disabled={saving}>{saving ? <>{spin} Saving...</> : 'Add Contract'}</Button>}
          </div>
        </div>
      </SlidePane>
    </>
  );
}