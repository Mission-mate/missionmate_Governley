import React from 'react';
import { AlertTriangle } from 'lucide-react';

/** Inline validation message shown under a currency/amount input. */
export default function AmountError({ message }) {
  if (!message) return null;
  return (
    <div className="flex items-center gap-1.5 mt-1.5 text-xs font-medium text-destructive">
      <AlertTriangle className="w-3.5 h-3.5 shrink-0" />
      <span>{message}</span>
    </div>
  );
}