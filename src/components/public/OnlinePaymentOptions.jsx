import React from 'react';
import { ExternalLink } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { onlinePaymentOptions } from '@/lib/membershipFee';

// Renders one or both online payment options (one-time / recurrent) on the
// public membership form, each with a clearly labelled Pay Now button and a
// guide line explaining rebilling vs. expiry. When both are offered, the
// member picks which one applies to them so it can be recorded on submission.
export default function OnlinePaymentOptions({ structure, tier, expirationPreview, selectedType, onSelectType }) {
  const options = onlinePaymentOptions(structure, tier);
  if (options.length === 0) return null;

  const selectable = options.length > 1;

  return (
    <div className="space-y-3">
      {options.map((opt) => {
        const guide = opt.type === 'recurrent'
          ? `This membership automatically rebills.${expirationPreview ? ` The next payment will be collected on ${expirationPreview}.` : ''}`
          : `This membership does not automatically rebill${expirationPreview ? ` and it will expire on ${expirationPreview}` : ''}.`;
        const active = selectable && selectedType === opt.type;

        return (
          <div
            key={opt.type}
            onClick={selectable ? () => onSelectType?.(opt.type) : undefined}
            className={cn(
              'rounded-xl border bg-muted/30 p-4 transition-colors',
              selectable && 'cursor-pointer',
              active ? 'border-primary ring-1 ring-primary bg-primary/5' : 'border-border',
              selectable && !active && 'hover:border-primary/50'
            )}
          >
            <div className="flex items-center justify-between gap-3">
              <div className="flex items-start gap-2.5">
                {selectable && (
                  <span className={cn(
                    'mt-1 w-4 h-4 rounded-full border flex items-center justify-center shrink-0',
                    active ? 'border-primary' : 'border-muted-foreground/40'
                  )}>
                    {active && <span className="w-2 h-2 rounded-full bg-primary" />}
                  </span>
                )}
                <div>
                  <p className="text-sm font-semibold text-foreground">{opt.title}</p>
                  <p className="text-xs text-muted-foreground mt-0.5">{guide}</p>
                </div>
              </div>
              <Button className="gap-1.5 shrink-0" asChild>
                <a
                  href={opt.link}
                  target="_blank"
                  rel="noopener noreferrer"
                  onClick={(e) => e.stopPropagation()}
                >
                  Pay Now <ExternalLink className="w-4 h-4" />
                </a>
              </Button>
            </div>
          </div>
        );
      })}
    </div>
  );
}