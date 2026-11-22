import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import TopBarBack from '@/components/shared/TopBarBack';
import { motion } from 'framer-motion';
import { base44 } from '@/api/base44Client';
import { Button } from '@/components/ui/button';
import { useToast } from '@/components/ui/use-toast';
import CapsuleTabs from '@/components/board/CapsuleTabs';
import ModuleLoader from '@/components/shared/states/ModuleLoader';
import useUnsavedChanges from '@/hooks/useUnsavedChanges';
import { structureToForm, formToStructure } from '@/lib/membershipStructures';
import StructureStepInfo from '@/components/settings/membership/StructureStepInfo';
import StructureStepRenewal from '@/components/settings/membership/StructureStepRenewal';
import StructureStepFees from '@/components/settings/membership/StructureStepFees';
import StructureStepWorkflow from '@/components/settings/membership/StructureStepWorkflow';

const TABS = [
  { value: 'details', label: 'Membership Details' },
  { value: 'renewal', label: 'Renewal & Expiry' },
  { value: 'fees', label: 'Fees & Payment' },
  { value: 'workflow', label: 'Approvals & Notifications' },
];

export default function MembershipPlanEditor() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { toast } = useToast();
  const isNew = id === 'new';

  const [form, setForm] = useState(structureToForm(null));
  const [structure, setStructure] = useState(null);
  const [tab, setTab] = useState('details');
  const [loading, setLoading] = useState(!isNew);
  const [saving, setSaving] = useState(false);
  const [baseline, setBaseline] = useState(structureToForm(null));
  const leaveTo = () => navigate('/membership/configuration');
  const { requestClose, dialog } = useUnsavedChanges({
    draft: form, baseline, onClose: leaveTo, saving, enabled: !loading, subject: 'membership plan changes',
  });

  useEffect(() => {
    let active = true;
    if (isNew) {
      setForm(structureToForm(null));
      setBaseline(structureToForm(null));
      setStructure(null);
      setLoading(false);
      return;
    }
    setLoading(true);
    base44.entities.MembershipStructure.get(id).then((s) => {
      if (!active) return;
      setStructure(s);
      setForm(structureToForm(s));
      setBaseline(structureToForm(s));
      setLoading(false);
    });
    return () => { active = false; };
  }, [id, isNew]);

  const handleSave = async () => {
    if (!form.name.trim()) {
      toast({ title: 'Membership Plan name is required', variant: 'destructive' });
      setTab('details');
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
      if (perTierLinks) {
        const missing = (form.tiers || []).some((t) => Number(t.fee_amount) > 0 && !t.payment_link?.trim());
        if (missing) {
          toast({ title: 'Payment link required', description: 'Each tier needs a payment link when Online Payment is accepted.', variant: 'destructive' });
          setTab('fees');
          return;
        }
      } else if (!form.payment_link?.trim()) {
        toast({ title: 'Payment link required', description: 'A payment link is required when Online Payment is accepted.', variant: 'destructive' });
        setTab('fees');
        return;
      }
    }
    try {
      setSaving(true);
      const payload = formToStructure(form);
      if (isNew) await base44.entities.MembershipStructure.create(payload);
      else await base44.entities.MembershipStructure.update(id, payload);
      toast({ title: isNew ? 'Membership plan created' : 'Membership plan updated' });
      navigate('/membership/configuration');
    } catch {
      toast({ title: 'Error', description: 'Failed to save membership plan.', variant: 'destructive' });
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return <ModuleLoader fullPage />;
  }

  return (
    <div className="p-6 max-w-4xl mx-auto">
      <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.2 }}>
        {/* Back */}
        {dialog}
        <TopBarBack onClick={() => requestClose()}>Back to Membership Plans</TopBarBack>

        {/* Header */}
        <div className="flex items-start justify-between gap-4 mb-6">
          <div>
            <h1 className="text-2xl font-bold text-foreground">
              {isNew ? 'New Membership Plan' : (structure?.name || 'Membership Plan')}
            </h1>
            <p className="text-sm text-muted-foreground mt-0.5">
              Configure the details, renewal, fees and application settings for this plan.
            </p>
          </div>
        </div>

        {/* Capsule tabs */}
        <CapsuleTabs animated tabs={TABS} value={tab} onChange={setTab} className="mb-6" />

        {/* Tab content */}
        <div className="rounded-xl border border-border bg-card p-6">
          {tab === 'details' && <StructureStepInfo form={form} setForm={setForm} />}
          {tab === 'renewal' && <StructureStepRenewal form={form} setForm={setForm} />}
          {tab === 'fees' && <StructureStepFees form={form} setForm={setForm} />}
          {tab === 'workflow' && <StructureStepWorkflow form={form} setForm={setForm} />}
        </div>

        {/* Footer actions */}
        <div className="flex items-center justify-end gap-3 mt-6">
          <Button variant="ghost" onClick={() => requestClose()} disabled={saving}>
            Cancel
          </Button>
          <Button onClick={handleSave} disabled={saving}>
            {saving ? 'Saving...' : isNew ? 'Create Plan' : 'Save Changes'}
          </Button>
        </div>
      </motion.div>
    </div>
  );
}