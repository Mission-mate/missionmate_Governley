import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { queryClientInstance } from '@/lib/query-client';
import { Button } from '@/components/ui/button';
import { LoaderOne } from '@/components/ui/loaders';
import { useToast } from '@/components/ui/use-toast';
import SlidePane from '@/components/ui/SlidePane';
import CapsuleTabs from '@/components/board/CapsuleTabs';
import { structureToForm, formToStructure, isSupportedRenewalPeriod, renewalIntervalError } from '@/lib/membershipStructures';
import { syncMemberPlanNames } from '@/lib/membership';
import { stepValidity, allStepsValid } from '@/lib/membershipPlanValidation';
import StructureStepInfo from '@/components/settings/membership/StructureStepInfo';
import StructureStepRenewal from '@/components/settings/membership/StructureStepRenewal';
import StructureStepFees from '@/components/settings/membership/StructureStepFees';
import StructureStepWorkflow from '@/components/settings/membership/StructureStepWorkflow';
import CloseButton from '@/components/shared/CloseButton';
import useUnsavedChanges from '@/hooks/useUnsavedChanges';

const TABS = [
{ value: 'details', label: 'Membership Details' },
{ value: 'renewal', label: 'Renewal & Expiry' },
{ value: 'fees', label: 'Fees & Payment' },
{ value: 'workflow', label: 'Approvals & Notifications' }];


export default function MembershipPlanEditorPane({ isOpen, planId, onClose: closeNow, onSaved }) {
  const { toast } = useToast();
  const isNew = planId === 'new';

  const [form, setForm] = useState(structureToForm(null));
  const [structure, setStructure] = useState(null);
  const [tab, setTab] = useState('details');
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [baseline, setBaseline] = useState(structureToForm(null));
  const { requestClose, dialog } = useUnsavedChanges({
    draft: form, baseline, onClose: closeNow, saving, enabled: isOpen && !loading, subject: 'membership plan changes',
  });
  const onClose = () => requestClose();

  useEffect(() => {
    if (!isOpen) return;
    let active = true;
    setTab('details');
    if (isNew) {
      setForm(structureToForm(null));
      setBaseline(structureToForm(null));
      setStructure(null);
      setLoading(false);
      return;
    }
    setLoading(true);
    base44.entities.MembershipStructure.get(planId).then((s) => {
      if (!active) return;
      setStructure(s);
      setForm(structureToForm(s));
      setBaseline(structureToForm(s));
      setLoading(false);
    });
    return () => {active = false;};
  }, [planId, isNew, isOpen]);

  const handleSave = async () => {
    if (!form.name.trim()) {
      toast({ title: 'Membership Plan name is required', variant: 'destructive' });
      setTab('details');
      return;
    }
    if (!isSupportedRenewalPeriod(form.renewal_period)) {
      toast({
        title: 'Renewal period required',
        description: 'This plan uses a renewal period that is no longer supported. Please select a supported renewal period.',
        variant: 'destructive',
      });
      setTab('renewal');
      return;
    }
    const intervalError = renewalIntervalError(form);
    if (intervalError) {
      toast({ title: 'Check the renewal interval', description: intervalError, variant: 'destructive' });
      setTab('renewal');
      return;
    }
    const methods = form.payment_methods || [];
    const paidPlan = (form.fee_type || 'Free') !== 'Free';
    if (paidPlan && methods.includes('Bank Transfer')) {
      if (!form.bank_account_name?.trim() || !form.bank_bsb?.trim() || !form.bank_account_number?.trim()) {
        toast({ title: 'Bank Transfer details required', description: 'Account Name, BSB and Account Number are required.', variant: 'destructive' });
        setTab('fees');
        return;
      }
    }
    if (paidPlan && methods.includes('Online Payment')) {
      const perTierLinks = form.fee_type === 'Tiered' && form.has_tiers;
      const bothTypes = form.online_payment_type === 'both';
      if (perTierLinks) {
        const missingOneTime = (form.tiers || []).some(
          (t) => Number(t.fee_amount) > 0 && !(t.one_time_payment_link ?? t.payment_link ?? '').trim()
        );
        if (missingOneTime) {
          toast({ title: 'Payment link required', description: `Each tier needs a ${bothTypes ? 'one-time ' : ''}payment link when Online Payment is accepted.`, variant: 'destructive' });
          setTab('fees');
          return;
        }
        if (bothTypes) {
          const missingRecurrent = (form.tiers || []).some((t) => Number(t.fee_amount) > 0 && !t.recurrent_payment_link?.trim());
          if (missingRecurrent) {
            toast({ title: 'Recurrent payment link required', description: 'Each tier needs a recurrent payment link when both payment types are accepted.', variant: 'destructive' });
            setTab('fees');
            return;
          }
        }
      } else if (!form.one_time_payment_link?.trim()) {
        toast({ title: 'Payment link required', description: 'A one-time payment link is required when Online Payment is accepted.', variant: 'destructive' });
        setTab('fees');
        return;
      } else if (form.online_payment_type === 'both' && !form.recurrent_payment_link?.trim()) {
        toast({ title: 'Recurrent payment link required', description: 'A recurrent payment link is required when both payment types are accepted.', variant: 'destructive' });
        setTab('fees');
        return;
      }
    }
    let renamed = false;
    let saved = false;
    try {
      setSaving(true);
      const payload = formToStructure(form);
      if (isNew) {
        await base44.entities.MembershipStructure.create(payload);
      } else {
        await base44.entities.MembershipStructure.update(planId, payload);
        const tierNamesOf = (tiers) => (tiers || []).map((t) => `${t.id}:${t.name || ''}`).join('|');
        renamed =
        (structure?.name || '') !== payload.name ||
        tierNamesOf(structure?.tiers) !== tierNamesOf(payload.tiers);
      }
      saved = true;
      toast({ title: isNew ? 'Membership plan created' : 'Membership plan updated' });
    } catch {
      toast({ title: 'Error', description: 'Failed to save membership plan.', variant: 'destructive' });
    } finally {
      setSaving(false);
    }

    if (!saved) return;
    setBaseline(form); // saved — a close from here on is clean

    // The plan is already saved — a cascade failure must never be reported as a
    // failed save. The nightly reconciliation repairs any names left stale here.
    if (renamed) {
      try {
        await syncMemberPlanNames(planId);
        // Submissions cache the plan name too — refresh the Submissions tab.
        queryClientInstance.invalidateQueries({ queryKey: ['membershipSubmissions'] });
      } catch {
        toast({
          title: 'Plan saved, but name sync failed',
          description: 'Some members or submissions may show the old name. This will be retried automatically tonight.',
          variant: 'destructive',
        });
      }
    }
    onSaved?.();
  };

  const currentIndex = TABS.findIndex((t) => t.value === tab);
  const isLastTab = currentIndex === TABS.length - 1;
  const validity = stepValidity(form);
  const canSave = allStepsValid(validity);
  const goNext = () => setTab(TABS[Math.min(currentIndex + 1, TABS.length - 1)].value);

  return (
    <SlidePane isOpen={isOpen} onClose={onClose}>
      {dialog}
      <div className="h-full flex flex-col bg-background shadow-2xl">
        {/* Header */}
        <div className="flex items-start justify-between gap-4 px-6 py-5 border-b border-border shrink-0">
          <div>
            <h1 className="text-xl font-bold text-foreground">
              {isNew ? 'New Membership Plan' : structure?.name || 'Membership Plan'}
            </h1>
            <p className="text-sm text-muted-foreground mt-0.5">
              Configure the details, renewal, fees and application settings for this plan.
            </p>
          </div>
          <CloseButton onClick={onClose} className="mt-1" />
        </div>

        {loading ?
        <div className="flex-1 flex justify-center items-center">
            <LoaderOne />
          </div> :

        <>
            {/* Tabs + content */}
            <div className="flex-1 overflow-y-auto px-6 py-5 [&_input]:bg-card [&_textarea]:bg-card [&_button[role=combobox]]:bg-card">
              <CapsuleTabs animated tabs={TABS} value={tab} onChange={setTab} className="mb-6" tabClassName="text-[13px]" />
              {tab === 'details' && <StructureStepInfo form={form} setForm={setForm} />}
              {tab === 'renewal' && <StructureStepRenewal form={form} setForm={setForm} />}
              {tab === 'fees' && <StructureStepFees form={form} setForm={setForm} />}
              {tab === 'workflow' && <StructureStepWorkflow form={form} setForm={setForm} />}
            </div>

            {/* Footer */}
            <div className="flex items-center justify-end gap-3 px-6 py-4 border-t border-border shrink-0">
              <Button variant="outline" onClick={onClose} disabled={saving}>
                Cancel
              </Button>
              {isLastTab ?
            <Button onClick={handleSave} disabled={saving || !canSave}>
                  {saving ? 'Saving...' : isNew ? 'Create Plan' : 'Save Changes'}
                </Button> :

            <Button onClick={goNext} disabled={saving || !validity[tab]}>
                  Next Step
                </Button>
            }
            </div>
          </>
        }
      </div>
    </SlidePane>);

}