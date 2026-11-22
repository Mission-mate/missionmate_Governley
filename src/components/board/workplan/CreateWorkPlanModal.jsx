import CloseButton from '@/components/shared/CloseButton';
import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import ModalOverlay from '@/components/ui/ModalOverlay';
import useUnsavedChanges from '@/hooks/useUnsavedChanges';
import CapsuleTabs from '@/components/board/CapsuleTabs';
import CircleStepper from '@/components/board/workplan/CircleStepper';
import WorkPlanDetailsForm from '@/components/board/workplan/WorkPlanDetailsForm';
import WorkPlanSourceSelect from '@/components/board/workplan/WorkPlanSourceSelect';
import {
  currentPeriodStart, clampStartYear, startYearFromDate,
  periodStartDate, periodEndDate, PERIOD_FINANCIAL,
} from '@/lib/financialYear';

const MODE_TABS = [
  { value: 'create', label: 'Create New' },
  { value: 'clone', label: 'Clone Existing' },
];

const STEPS = {
  create: [],
  clone: ['Details', 'Clone'],
};

export default function CreateWorkPlanModal({ isOpen, onClose, onSubmit, workPlan, plans = [] }) {
  const isEdit = !!workPlan;
  const [mode, setMode] = useState('create');
  const [step, setStep] = useState(0);
  const [values, setValues] = useState({
    title: '', description: '', status: 'active',
    periodType: PERIOD_FINANCIAL, startYear: currentPeriodStart(PERIOD_FINANCIAL),
  });
  const [cloneFromId, setCloneFromId] = useState('');
  const [busy, setBusy] = useState(false);
  const [baseline, setBaseline] = useState(null);

  useEffect(() => {
    if (isOpen) {
      const type = workPlan?.compliance_period_type || PERIOD_FINANCIAL;
      setMode('create');
      setStep(0);
      const initial = {
        title: workPlan?.title || '',
        description: workPlan?.description || '',
        status: workPlan?.status || 'active',
        periodType: type,
        startYear: clampStartYear(startYearFromDate(workPlan?.financial_year_start) ?? currentPeriodStart(type)),
      };
      setValues(initial);
      setBaseline(initial);
      setCloneFromId('');
      setBusy(false);
    }
  }, [isOpen, workPlan]);

  const patch = (next) => setValues((v) => ({ ...v, ...next }));

  // Switching Reporting Year resets the period to the current cycle for that type.
  const handlePeriodTypeChange = (type) => patch({ periodType: type, startYear: clampStartYear(currentPeriodStart(type)) });

  const handleModeChange = (next) => { setMode(next); setStep(0); };

  const steps = isEdit ? [] : STEPS[mode];
  const isLastStep = steps.length === 0 || step === steps.length - 1;
  const detailsValid = !!values.title.trim();

  const canSubmit =
    detailsValid && !busy &&
    (isEdit || mode === 'create' || (mode === 'clone' && !!cloneFromId));

  const handleSubmit = async () => {
    if (!canSubmit) return;
    setBusy(true);
    try {
      await onSubmit({
        title: values.title.trim(),
        description: values.description.trim(),
        status: values.status,
        compliance_period_type: values.periodType,
        financial_year_start: periodStartDate(values.periodType, values.startYear),
        financial_year_end: periodEndDate(values.periodType, values.startYear),
        cloneFromId: !isEdit && mode === 'clone' ? cloneFromId : '',
      });
    } finally {
      setBusy(false);
    }
  };

  const submitLabel = isEdit ? 'Save Changes' : mode === 'clone' ? 'Clone' : 'Create';

  const guard = useUnsavedChanges({
    draft: { ...values, cloneFromId },
    baseline: baseline && { ...baseline, cloneFromId: '' },
    onClose,
    saving: busy,
    enabled: isOpen && !!baseline,
  });

  return (
    <ModalOverlay isOpen={isOpen} onClose={guard.requestClose} className="w-full max-w-lg">
      <div className="bg-white dark:bg-card rounded-2xl shadow-2xl flex flex-col max-h-[88vh]">
        <div className="flex items-center justify-between px-6 pt-5 pb-4 border-b border-border">
          <h2 className="text-lg font-bold text-foreground">{isEdit ? 'Edit Work Plan' : 'Create a New Work Plan'}</h2>
          <CloseButton onClick={() => guard.requestClose()} />
        </div>

        {!isEdit && (
          <div className="flex justify-center px-6 pt-4">
            <CapsuleTabs tabs={MODE_TABS} value={mode} onChange={handleModeChange} />
          </div>
        )}

        {steps.length > 0 && (
          <div className="px-6 pt-5">
            <CircleStepper steps={steps} current={step} />
          </div>
        )}

        <div className="px-6 py-5 overflow-y-auto">
          {(isEdit || step === 0) && (
            <WorkPlanDetailsForm values={values} onChange={patch} onPeriodTypeChange={handlePeriodTypeChange} />
          )}

          {!isEdit && mode === 'clone' && step === 1 && (
            <div>
              <Label className="mb-1.5 block text-sm font-medium text-foreground">
                Select an existing work plan to clone <span className="text-destructive">*</span>
              </Label>
              <WorkPlanSourceSelect plans={plans} value={cloneFromId} onChange={setCloneFromId} />
            </div>
          )}
        </div>

        <div className="flex items-center justify-end gap-3 px-6 py-4 border-t border-border">
          {step > 0 ? (
            <Button variant="outline" onClick={() => setStep((s) => s - 1)}>Back</Button>
          ) : (
            <Button variant="outline" onClick={() => guard.requestClose()}>Cancel</Button>
          )}
          {isLastStep ? (
            <Button onClick={handleSubmit} disabled={!canSubmit}>{busy ? 'Saving...' : submitLabel}</Button>
          ) : (
            <Button onClick={() => setStep((s) => s + 1)} disabled={!detailsValid}>Next</Button>
          )}
        </div>
      </div>
      {guard.dialog}
    </ModalOverlay>
  );
}