import React from 'react';
import { X } from 'lucide-react';
import { useAuth } from '@/lib/AuthContext';

/** Menu header: soft blue/lilac wash, eyebrow, close and a serif greeting. */
export default function HelpMenuHeader({ onClose }) {
  const { user } = useAuth();
  const firstName = user?.full_name?.trim().split(/\s+/)[0] || 'there';
  return (
    <header className="shrink-0 bg-[radial-gradient(120%_90%_at_0%_0%,rgb(219_234_254)_0%,transparent_60%),radial-gradient(90%_80%_at_100%_0%,rgb(243_232_255)_0%,transparent_60%)] pb-[22px] pl-6 pr-[18px] pt-[18px] dark:bg-[radial-gradient(120%_90%_at_0%_0%,rgb(59_130_246/0.16)_0%,transparent_60%),radial-gradient(90%_80%_at_100%_0%,rgb(168_85_247/0.14)_0%,transparent_60%)]">
      <div className="flex items-center justify-between">
        <span className="text-[13px] font-semibold tracking-[0.01em] text-foreground/75">Help &amp; Support</span>
        <button
          type="button"
          onClick={onClose}
          aria-label="Close"
          className="flex h-[34px] w-[34px] items-center justify-center rounded-full bg-card/70 text-foreground/75 transition-colors hover:bg-card hover:text-foreground"
        >
          <X className="h-4 w-4" strokeWidth={1.9} />
        </button>
      </div>
      <h2 className="mt-3.5 font-serif text-[38px] font-normal leading-[1.05] tracking-[-0.01em] text-foreground">
        Hi {firstName},<br />how can we help?
      </h2>
    </header>
  );
}