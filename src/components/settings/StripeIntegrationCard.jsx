import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { CreditCard, Lock } from 'lucide-react';
import ModalOverlay from '@/components/ui/ModalOverlay';
import CloseButton from '@/components/shared/CloseButton';

const StripeLogo = () => (
  <svg viewBox="0 0 32 32" className="w-8 h-8" xmlns="http://www.w3.org/2000/svg">
    <rect width="32" height="32" rx="7" fill="#635BFF" />
    <path
      fill="#fff"
      d="M14.6 12.7c0-.66.54-.92 1.43-.92 1.28 0 2.9.39 4.18 1.08V9.05a11.1 11.1 0 0 0-4.18-.77c-3.42 0-5.7 1.79-5.7 4.78 0 4.66 6.42 3.92 6.42 5.93 0 .78-.68 1.03-1.62 1.03-1.4 0-3.18-.57-4.59-1.35v3.85a11.65 11.65 0 0 0 4.59.96c3.5 0 5.92-1.73 5.92-4.76 0-5.03-6.45-4.14-6.45-6.05Z"
    />
  </svg>
);

// UI-only Stripe integration card. Connect opens a modal to enter Stripe keys.
export default function StripeIntegrationCard() {
  const [open, setOpen] = useState(false);
  const [publicKey, setPublicKey] = useState('');
  const [secretKey, setSecretKey] = useState('');

  return (
    <>
      <div className="border border-border rounded-xl p-5 flex items-start gap-4 bg-card">
        <div className="shrink-0 mt-0.5"><StripeLogo /></div>
        <div className="flex-1 min-w-0">
          <h3 className="text-sm font-bold text-foreground mb-1">Stripe</h3>
          <p className="text-sm text-muted-foreground">
            Connect Stripe to collect membership fees and link your product catalogue to membership structures.
          </p>
        </div>
        <div className="shrink-0">
          <Button size="sm" variant="default" className="gap-1.5" onClick={() => setOpen(true)}>
            <CreditCard className="w-4 h-4" />
            Connect
          </Button>
        </div>
      </div>

      <ModalOverlay isOpen={open} onClose={() => setOpen(false)} className="w-full max-w-md">
        <div className="bg-card rounded-xl shadow-xl p-6">
          <div className="flex items-start justify-between mb-1">
            <div className="flex items-center gap-3">
              <StripeLogo />
              <div>
                <h2 className="text-lg font-bold text-foreground">Connect Stripe</h2>
                <p className="text-sm text-muted-foreground">For future payment processing setup.</p>
              </div>
            </div>
            <CloseButton onClick={() => setOpen(false)} />
          </div>

          <div className="space-y-4 mt-5">
            <div>
              <Label className="text-sm font-bold mb-1.5 block">Stripe Public Key</Label>
              <Input
                placeholder="pk_live_..."
                value={publicKey}
                onChange={(e) => setPublicKey(e.target.value)}
              />
            </div>

            <div>
              <Label className="text-sm font-bold mb-1.5 block">Stripe Secret Key</Label>
              <div className="relative">
                <Input
                  type="password"
                  placeholder="sk_live_..."
                  value={secretKey}
                  onChange={(e) => setSecretKey(e.target.value)}
                  className="pr-9"
                />
                <Lock className="w-4 h-4 text-muted-foreground absolute right-3 top-1/2 -translate-y-1/2" />
              </div>
              <p className="text-xs text-muted-foreground mt-1.5">
                Your secret key is encrypted and never stored in plain text.
              </p>
            </div>

            <Button className="w-full gap-1.5" disabled>
              <CreditCard className="w-4 h-4" />
              Connect Stripe
            </Button>
            <p className="text-xs text-muted-foreground text-center">
              Stripe integration will be available in a future release.
            </p>
          </div>
        </div>
      </ModalOverlay>
    </>
  );
}