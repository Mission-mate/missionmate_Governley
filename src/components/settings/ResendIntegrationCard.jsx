import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Mail, Lock } from 'lucide-react';
import ModalOverlay from '@/components/ui/ModalOverlay';
import CloseButton from '@/components/shared/CloseButton';

const ResendLogo = () => (
  <svg viewBox="0 0 32 32" className="w-8 h-8" xmlns="http://www.w3.org/2000/svg">
    <rect width="32" height="32" rx="7" fill="#000" />
    <path
      fill="#fff"
      d="M10 9h6.6c2.7 0 4.6 1.7 4.6 4.2 0 1.9-1.1 3.4-2.9 4l3.1 5.8h-3.3l-2.7-5.3h-2.3V23H10V9zm3.1 2.6v3.6h3.1c1.2 0 2-.7 2-1.8s-.8-1.8-2-1.8h-3.1z"
    />
  </svg>
);

// UI-only placeholder card. Connect opens a modal to enter the Resend API key.
export default function ResendIntegrationCard() {
  const [open, setOpen] = useState(false);
  const [apiKey, setApiKey] = useState('');
  const [replyTo, setReplyTo] = useState('');

  return (
    <>
      <div className="border border-border rounded-xl p-5 flex items-start gap-4 bg-card">
        <div className="shrink-0 mt-0.5"><ResendLogo /></div>
        <div className="flex-1 min-w-0">
          <h3 className="text-sm font-bold text-foreground mb-1">Resend</h3>
          <p className="text-sm text-muted-foreground">
            Send emails using your organisation's own domain by connecting your Resend account.
          </p>
        </div>
        <div className="shrink-0">
          <Button size="sm" variant="default" className="gap-1.5" onClick={() => setOpen(true)}>
            <Mail className="w-4 h-4" />
            Connect
          </Button>
        </div>
      </div>

      <ModalOverlay isOpen={open} onClose={() => setOpen(false)} className="w-full max-w-md">
        <div className="bg-card rounded-xl shadow-xl p-6">
          <div className="flex items-start justify-between mb-1">
            <div className="flex items-center gap-3">
              <ResendLogo />
              <div>
                <h2 className="text-lg font-bold text-foreground">Connect Resend</h2>
                <p className="text-sm text-muted-foreground">Send emails from your organisation's domain.</p>
              </div>
            </div>
            <CloseButton onClick={() => setOpen(false)} />
          </div>

          <div className="space-y-4 mt-5">
            <div>
              <Label className="text-sm font-bold mb-1.5 block">Resend API Key</Label>
              <div className="relative">
                <Input
                  type="password"
                  placeholder="re_..."
                  value={apiKey}
                  onChange={(e) => setApiKey(e.target.value)}
                  className="pr-9"
                />
                <Lock className="w-4 h-4 text-muted-foreground absolute right-3 top-1/2 -translate-y-1/2" />
              </div>
              <p className="text-xs text-muted-foreground mt-1.5">
                Your API key is encrypted and never stored in plain text.
              </p>
            </div>

            <div>
              <Label className="text-sm font-bold mb-1.5 block">Reply To Address</Label>
              <Input
                type="email"
                placeholder="replies@yourdomain.org"
                value={replyTo}
                onChange={(e) => setReplyTo(e.target.value)}
              />
              <p className="text-xs text-muted-foreground mt-1.5">
                Replies to outbound emails will be routed to this address.
              </p>
            </div>

            <Button className="w-full gap-1.5" disabled>
              <Mail className="w-4 h-4" />
              Connect Resend
            </Button>
            <p className="text-xs text-muted-foreground text-center">
              Resend integration will be available in a future release.
            </p>
          </div>
        </div>
      </ModalOverlay>
    </>
  );
}