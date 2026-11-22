import React from 'react';
import { ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import PaymentInfoCard from '@/components/public/PaymentInfoCard';
import OnlinePaymentOptions from '@/components/public/OnlinePaymentOptions';
import { resolveFee, isPaidStructure, formatFee, renewalLabel } from '@/lib/membershipFee';

// Normalize accepted payment methods across new + legacy shapes.
function getMethods(s) {
  if (Array.isArray(s?.payment_methods) && s.payment_methods.length) return s.payment_methods;
  if (s?.payment_method === 'Payment Link') return ['Online Payment'];
  if (s?.payment_method) return [s.payment_method];
  return [];
}

/**
 * Step 4 — Summary & payment. Shows the calculated membership due, lets the
 * applicant pick a payment method, agree to terms, and submit.
 */
export default function PaymentStep({
  structure, tier, expirationPreview, selectedMethod, onSelectMethod,
  onlinePaymentType, onSelectOnlineType,
  agreed, onAgreedChange, error, submitting, onBack, onSubmit,
}) {
  const paid = isPaidStructure(structure);
  const fee = resolveFee(structure, tier);
  const period = renewalLabel(structure);
  const methods = getMethods(structure);

  return (
    <div className="max-w-2xl mx-auto px-4 sm:px-6 md:px-8 py-8 md:py-10">
      <button onClick={onBack} className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground mb-6">
        <ArrowLeft className="w-4 h-4" /> Back
      </button>

      <div className="bg-card border border-border rounded-xl p-5 sm:p-7 shadow-sm space-y-6">
        <div>
          <h2 className="text-xl font-bold text-foreground">Review & Payment</h2>
          <p className="text-sm text-muted-foreground mt-1">{structure?.name}{tier ? ` — ${tier.name}` : ''}</p>
        </div>

        {/* Fee summary */}
        <div className="rounded-lg bg-muted/40 border border-border p-4 flex items-center justify-between">
          <div>
            <p className="text-xs text-muted-foreground">Membership due</p>
            {expirationPreview && <p className="text-xs text-muted-foreground mt-0.5">Valid until {expirationPreview}</p>}
          </div>
          <p className="text-2xl font-bold text-foreground">
            {paid && fee > 0 ? formatFee(fee) : 'Free'}
            {paid && fee > 0 && period && <span className="text-sm text-muted-foreground font-normal"> /{period}</span>}
          </p>
        </div>

        {/* Payment method selection */}
        {paid && fee > 0 && methods.length > 0 && (
          <div>
            <h3 className="text-sm font-bold text-foreground mb-3">Select a payment method</h3>
            <div className="space-y-2">
              {methods.map((m) => (
                <button
                  key={m}
                  type="button"
                  onClick={() => onSelectMethod(m)}
                  className={`w-full text-left rounded-lg border px-4 py-3 text-sm font-medium transition-colors ${selectedMethod === m ? 'border-primary bg-primary/5 text-foreground' : 'border-border hover:border-primary/50 text-muted-foreground'}`}
                >
                  {m}
                </button>
              ))}
            </div>

            {/* Instructions for the chosen method */}
            {selectedMethod && (
              <div className="mt-4">
                {selectedMethod === 'Online Payment' ? (
                  <>
                    <OnlinePaymentOptions
                      structure={structure}
                      tier={tier}
                      expirationPreview={expirationPreview}
                      selectedType={onlinePaymentType}
                      onSelectType={onSelectOnlineType}
                    />
                    <p className="text-xs text-muted-foreground mt-2">
                      Please make sure to submit this application once your payment has been processed.
                    </p>
                  </>
                ) : (
                  <PaymentInfoCard structure={{ ...structure, payment_methods: [selectedMethod], payment_link: (tier && tier.payment_link) || structure.payment_link }} />
                )}
              </div>
            )}
          </div>
        )}

        {/* Agreement */}
        <label className="flex items-start gap-2.5 cursor-pointer">
          <Checkbox checked={agreed} onCheckedChange={onAgreedChange} className="mt-0.5" />
          <span className="text-sm text-muted-foreground">
            I confirm the information provided is accurate and I agree to the membership terms.
            <span className="text-destructive"> *</span>
          </span>
        </label>

        {error && <p className="text-sm text-destructive">{error}</p>}

        <Button className="w-full" disabled={submitting || !agreed} onClick={onSubmit}>
          {submitting ? 'Submitting...' : 'Submit Membership Application'}
        </Button>
      </div>
    </div>
  );
}