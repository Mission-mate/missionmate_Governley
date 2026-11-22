import React from 'react';
import { Button } from '@/components/ui/button';

/** Microsoft Authenticator brand mark — blue shield with the white lock/check. */
function MicrosoftAuthenticatorLogo() {
  return (
    <svg viewBox="0 0 48 48" className="w-9 h-9 shrink-0" aria-hidden="true">
      <path d="M24 3 6 9v14.4C6 34.3 13.6 42.7 24 45c10.4-2.3 18-10.7 18-21.6V9L24 3Z" fill="#0F6CBD" />
      <path d="M24 3v42c10.4-2.3 18-10.7 18-21.6V9L24 3Z" fill="#0A4E8C" />
      <path d="M18.4 15.6h11.2c1.1 0 2 .9 2 2v12.8c0 1.1-.9 2-2 2H18.4c-1.1 0-2-.9-2-2V17.6c0-1.1.9-2 2-2Z" fill="#fff" />
      <path d="M24 20.2a2.6 2.6 0 0 1 2.6 2.6v1.4h-5.2v-1.4a2.6 2.6 0 0 1 2.6-2.6Z" fill="#0F6CBD" />
      <rect x="20.6" y="24" width="6.8" height="5.4" rx="1" fill="#0F6CBD" />
    </svg>
  );
}

/** Microsoft Authenticator MFA option — elevated nested card. */
export default function MicrosoftAuthenticatorCard() {
  return (
    <div className="rounded-xl border border-border bg-white dark:bg-card p-5 shadow-md shadow-black/5 transition-shadow hover:shadow-lg">
      <div className="flex items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <MicrosoftAuthenticatorLogo />
          <div>
            <p className="text-sm font-semibold text-foreground">Microsoft Authenticator</p>
            <p className="text-xs text-muted-foreground mt-0.5 max-w-md">
              Microsoft multifactor authentication (MFA) adds a layer of protection to the sign-in
              process and helps protect your organization against security breaches.
            </p>
          </div>
        </div>
        <Button size="sm" className="text-xs h-8 shrink-0">Connect</Button>
      </div>
    </div>
  );
}