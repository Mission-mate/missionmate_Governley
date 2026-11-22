import React, { useState, useEffect, useMemo } from 'react';
import { CheckCircle2, Loader2 } from 'lucide-react';
import { base44 } from '@/api/base44Client';
import { calculateExpirationDate } from '@/lib/membership';
import { FORM_CONFIG_SLUG } from '@/lib/membershipForm';
import { isFieldVisible, isFieldVisibleForPlan } from '@/lib/conditionalLogic';
import { hasSelectableTiers, resolveFee, isPaidStructure, onlinePaymentOptions } from '@/lib/membershipFee';
import { useOrgProfile } from '@/hooks/useOrgProfile';
import PublicFormHeader from '@/components/public/PublicFormHeader';
import PublicFormFooter from '@/components/public/PublicFormFooter';
import PlanGrid from '@/components/public/PlanGrid';
import PlanDetailStep from '@/components/public/PlanDetailStep';
import ApplicationFormStep from '@/components/public/ApplicationFormStep';
import PaymentStep from '@/components/public/PaymentStep';
import { format, parseISO } from 'date-fns';
import { localToday } from '@/lib/localClock';

// Flow steps.
const STEP = { PLANS: 'plans', DETAIL: 'detail', FORM: 'form', PAYMENT: 'payment' };

export default function PublicMembershipForm({ sandbox = false, mobile = false }) {
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState(null);
  const [values, setValues] = useState({});
  const [customValues, setCustomValues] = useState({});
  const [step, setStep] = useState(STEP.PLANS);
  const [structureId, setStructureId] = useState('');
  const [tierId, setTierId] = useState('');
  const [paymentMethod, setPaymentMethod] = useState('');
  const [onlinePaymentType, setOnlinePaymentType] = useState('');
  const [agreed, setAgreed] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState('');
  const [honeypot, setHoneypot] = useState('');

  const { name: orgName, logoUrl } = useOrgProfile();

  useEffect(() => {
    base44.functions.invoke('getMembershipForm', { slug: FORM_CONFIG_SLUG })
      .then((res) => setData(res.data))
      .catch(() => setData({ available: false }))
      .finally(() => setLoading(false));
  }, []);

  const config = data?.config;
  const structures = data?.structures || [];
  const customFields = data?.customFields || [];
  const customById = useMemo(() => Object.fromEntries(customFields.map((f) => [f.id, f])), [customFields]);

  const availableStructures = useMemo(
    () => structures.filter((s) => s.status !== 'archived'),
    [structures]
  );

  const selectedStructure = useMemo(
    () => availableStructures.find((s) => s.id === structureId) || null,
    [availableStructures, structureId]
  );

  const selectedTier = useMemo(() => {
    if (!selectedStructure || !hasSelectableTiers(selectedStructure)) return null;
    return (selectedStructure.tiers || []).find((t) => t.id === tierId) || null;
  }, [selectedStructure, tierId]);

  // Merge system + custom answers so conditional logic can read any trigger field.
  const answers = useMemo(() => ({ ...values, ...customValues }), [values, customValues]);

  // Questions shown for the selected plan (field-to-field + plan visibility).
  const layout = useMemo(
    () => (config?.field_layout || []).filter(
      (f) => f.enabled && !f.hidden && isFieldVisible(f, answers) && isFieldVisibleForPlan(f, structureId)
    ),
    [config, answers, structureId]
  );

  const expirationPreview = useMemo(() => {
    if (!selectedStructure) return null;
    if (selectedStructure.is_lifetime) return 'Lifetime — never expires';
    const exp = calculateExpirationDate(localToday(), selectedStructure);
    return exp ? format(parseISO(exp), 'd MMM yyyy') : null;
  }, [selectedStructure]);

  // Default / reconcile the chosen online payment type based on the plan's
  // available options once Online Payment is the selected method.
  useEffect(() => {
    if (paymentMethod !== 'Online Payment') { setOnlinePaymentType(''); return; }
    const opts = onlinePaymentOptions(selectedStructure, selectedTier);
    if (opts.length === 0) { setOnlinePaymentType(''); return; }
    setOnlinePaymentType((cur) => (opts.some((o) => o.type === cur) ? cur : opts[0].type));
  }, [paymentMethod, selectedStructure, selectedTier]);

  const setVal = (id) => (v) => setValues((prev) => ({ ...prev, [id]: v }));
  const setCustomVal = (id) => (v) => setCustomValues((prev) => ({ ...prev, [id]: v }));

  const startJoin = (structure) => {
    setStructureId(structure.id);
    setTierId('');
    setPaymentMethod('');
    setOnlinePaymentType('');
    setAgreed(false);
    setError('');
    setStep(STEP.DETAIL);
  };

  const goToForm = () => { setError(''); setStep(STEP.FORM); };

  // Validate mandatory fields before moving to payment.
  const goToPayment = () => {
    setError('');
    for (const f of layout) {
      if (!f.mandatory) continue;
      const val = f.kind === 'system' ? values[f.field_id] : customValues[f.field_id];
      const empty = val == null || val === '' || (Array.isArray(val) && val.length === 0);
      if (empty) { setError(`${f.label} is required.`); return; }
    }
    setStep(STEP.PAYMENT);
  };

  const handleSubmit = async () => {
    setError('');
    if (!structureId) { setError('Please select a membership plan.'); return; }
    const paid = isPaidStructure(selectedStructure);
    if (paid && !paymentMethod) { setError('Please select a payment method.'); return; }
    if (!agreed) { setError('Please confirm and agree to continue.'); return; }

    // Sandbox preview: simulate a successful submission without writing data.
    if (sandbox) {
      setSubmitting(true);
      setTimeout(() => { setSubmitting(false); setSubmitted(true); }, 500);
      return;
    }

    try {
      setSubmitting(true);
      const res = await base44.functions.invoke('submitMembershipForm', {
        slug: FORM_CONFIG_SLUG,
        values,
        custom_fields: customValues,
        structure_id: structureId,
        tier_id: tierId || '',
        payment_method: paymentMethod || '',
        online_payment_type: paymentMethod === 'Online Payment' ? onlinePaymentType : '',
        fee_amount: resolveFee(selectedStructure, selectedTier),
        today: localToday(),
        website: honeypot,
      });
      if (res.data?.success) setSubmitted(true);
      else setError(res.data?.error || 'Something went wrong. Please try again.');
    } catch {
      setError('Something went wrong. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-muted/30">
        <Loader2 className="w-7 h-7 text-primary animate-spin" />
      </div>
    );
  }

  if (!data?.available) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-muted/30 px-4">
        <div className="text-center max-w-md">
          <h1 className="text-xl font-bold text-foreground mb-2">Form unavailable</h1>
          <p className="text-sm text-muted-foreground">This membership form is not currently accepting submissions.</p>
        </div>
      </div>
    );
  }

  if (submitted) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-muted/30 px-4">
        <div className="bg-card border border-border rounded-2xl shadow-sm p-8 max-w-md text-center">
          <div className="w-14 h-14 rounded-full bg-green-100 flex items-center justify-center mx-auto mb-4">
            <CheckCircle2 className="w-7 h-7 text-green-600" />
          </div>
          <h1 className="text-xl font-bold text-foreground mb-2">Submission received</h1>
          <p className="text-sm text-muted-foreground">{config.success_message}</p>
          {sandbox && (
            <p className="text-xs text-amber-600 mt-4 font-medium">Sandbox preview — no member was actually created.</p>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-muted/30">
      {sandbox && (
        <div className="sticky top-0 z-20 bg-amber-500 text-white text-center text-xs font-semibold py-2 px-4">
          Sandbox Preview — this is exactly what new members see. No data is saved.
        </div>
      )}
      {/* Honeypot — hidden from users */}
      <input
        type="text" value={honeypot} onChange={(e) => setHoneypot(e.target.value)}
        tabIndex={-1} autoComplete="off"
        className="absolute -left-[9999px] w-px h-px" aria-hidden="true"
      />

      <PublicFormHeader
        bannerUrl={config.banner_url}
        logoUrl={logoUrl}
        orgName={orgName}
        title={config.title}
        description={config.description}
      />

      {step === STEP.PLANS && (
        <PlanGrid structures={availableStructures} onJoin={startJoin} mobile={mobile} />
      )}

      {step === STEP.DETAIL && selectedStructure && (
        <PlanDetailStep
          structure={selectedStructure}
          selectedTierId={tierId}
          onSelectTier={setTierId}
          onBack={() => setStep(STEP.PLANS)}
          onContinue={goToForm}
        />
      )}

      {step === STEP.FORM && selectedStructure && (
        <ApplicationFormStep
          structure={selectedStructure}
          layout={layout}
          customById={customById}
          values={values}
          customValues={customValues}
          setVal={setVal}
          setCustomVal={setCustomVal}
          error={error}
          onBack={() => setStep(STEP.DETAIL)}
          onContinue={goToPayment}
        />
      )}

      {step === STEP.PAYMENT && selectedStructure && (
        <PaymentStep
          structure={selectedStructure}
          tier={selectedTier}
          expirationPreview={expirationPreview}
          selectedMethod={paymentMethod}
          onSelectMethod={setPaymentMethod}
          onlinePaymentType={onlinePaymentType}
          onSelectOnlineType={setOnlinePaymentType}
          agreed={agreed}
          onAgreedChange={setAgreed}
          error={error}
          submitting={submitting}
          onBack={() => setStep(STEP.FORM)}
          onSubmit={handleSubmit}
        />
      )}

      <PublicFormFooter
        supportEmail={config.support_email}
        socialLinks={config.social_links}
      />
    </div>
  );
}