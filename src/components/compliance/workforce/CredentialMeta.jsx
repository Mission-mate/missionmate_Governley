import React from 'react';

/** Muted meta line under a credential title (card number or "Restricted", jurisdiction). */
export default function CredentialMeta({ parts, restricted }) {
  return (
    <div className="text-xs text-muted-foreground mt-0.5">
      {[restricted && 'Restricted', ...parts].filter(Boolean).join(' · ')}
    </div>
  );
}