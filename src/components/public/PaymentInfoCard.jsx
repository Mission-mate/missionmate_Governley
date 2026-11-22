import React from 'react';
import { Landmark, ExternalLink, Banknote, FileText } from 'lucide-react';
import { Button } from '@/components/ui/button';

const Row = ({ label, value }) => (
  <div className="flex items-center justify-between py-1.5 border-b border-border last:border-0">
    <span className="text-xs text-muted-foreground">{label}</span>
    <span className="text-sm font-semibold text-foreground">{value}</span>
  </div>
);

// Normalize accepted payment methods across new (payment_methods array) and
// legacy (single payment_method) shapes.
const getMethods = (s) => {
  if (Array.isArray(s?.payment_methods) && s.payment_methods.length) return s.payment_methods;
  if (s?.payment_method === 'Payment Link') return ['Online Payment'];
  if (s?.payment_method) return [s.payment_method];
  return [];
};

// Renders the payment instructions on the public form / preview based on the
// structure's accepted payment methods.
export default function PaymentInfoCard({ structure }) {
  if (!structure) return null;
  const feeType = structure.fee_type;
  const isPaid = feeType && feeType !== 'Free' && feeType !== 'No Membership Fee';
  if (!isPaid) return null;

  const methods = getMethods(structure);
  if (methods.length === 0) return null;

  return (
    <div className="space-y-3">
      {methods.includes('Cash') && (
        <div className="rounded-xl border border-border bg-muted/30 p-4 flex items-start gap-3">
          <Banknote className="w-5 h-5 text-muted-foreground shrink-0 mt-0.5" />
          <div>
            <p className="text-sm font-semibold text-foreground">Pay by Cash</p>
            <p className="text-xs text-muted-foreground">Payment will be collected in person after you submit this form.</p>
          </div>
        </div>
      )}

      {methods.includes('Bank Transfer') && (
        <div className="rounded-xl border border-border bg-muted/30 p-4">
          <div className="flex items-center gap-2 mb-3">
            <Landmark className="w-5 h-5 text-primary" />
            <p className="text-sm font-semibold text-foreground">Pay by Bank Transfer</p>
          </div>
          <div className="rounded-lg bg-background border border-border px-3 py-1">
            {structure.bank_account_name && <Row label="Account Name" value={structure.bank_account_name} />}
            {structure.bank_bsb && <Row label="BSB" value={structure.bank_bsb} />}
            {structure.bank_account_number && <Row label="Account Number" value={structure.bank_account_number} />}
            {structure.show_pay_id && structure.pay_id && <Row label="PayID" value={structure.pay_id} />}
            {structure.bank_payment_reference && <Row label="Payment Reference" value={structure.bank_payment_reference} />}
          </div>
        </div>
      )}

      {methods.includes('Online Payment') && structure.payment_link && (
        <div className="rounded-xl border border-border bg-muted/30 p-4 flex items-center justify-between gap-3">
          <div>
            <p className="text-sm font-semibold text-foreground">Pay Online</p>
            <p className="text-xs text-muted-foreground">Complete your payment securely via the link.</p>
          </div>
          <Button className="gap-1.5 shrink-0" asChild>
            <a href={structure.payment_link} target="_blank" rel="noopener noreferrer">
              Pay Now <ExternalLink className="w-4 h-4" />
            </a>
          </Button>
        </div>
      )}

      {methods.includes('Invoice') && (
        <div className="rounded-xl border border-border bg-muted/30 p-4 flex items-start gap-3">
          <FileText className="w-5 h-5 text-muted-foreground shrink-0 mt-0.5" />
          <div>
            <p className="text-sm font-semibold text-foreground">Pay by Invoice</p>
            <p className="text-xs text-muted-foreground">An invoice will be issued to you after you submit this form.</p>
          </div>
        </div>
      )}
    </div>
  );
}