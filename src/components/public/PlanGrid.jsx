import React from 'react';
import { Button } from '@/components/ui/button';
import { resolveFee, isPaidStructure, formatFee, renewalLabel } from '@/lib/membershipFee';

/**
 * Step 1 — Membership plan options presented as block cards. Each card shows the
 * plan name, price + renewal period, an optional description and a Join button.
 */
export default function PlanGrid({ structures, onJoin, mobile = false }) {
  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 md:px-8 py-8 md:py-10">
      <h2 className="text-xl sm:text-2xl font-bold text-foreground text-center mb-6 md:mb-8">Membership Options</h2>

      {structures.length === 0 ? (
        <p className="text-center text-sm text-muted-foreground">No membership plans are currently available.</p>
      ) : (
        <div className={mobile ? 'grid gap-4 grid-cols-1' : 'grid gap-5 sm:grid-cols-2 lg:grid-cols-3'}>
          {structures.map((s) => {
            const paid = isPaidStructure(s);
            const fee = resolveFee(s);
            const period = renewalLabel(s);
            return (
              <div key={s.id} className="bg-card border border-border rounded-xl p-5 sm:p-6 flex flex-col shadow-sm">
                <h3 className="text-lg font-bold text-foreground">{s.name}</h3>
                <div className="mt-2 flex items-baseline gap-1.5">
                  {paid && s.fee_type === 'Tiered' && s.tier_fees_differ ? (
                    <span className="text-xl font-bold text-foreground">Tier Based Pricing</span>
                  ) : (
                    <>
                      <span className="text-3xl font-bold text-foreground">{paid ? formatFee(fee) : 'Free'}</span>
                      {paid && period && <span className="text-sm text-muted-foreground">/{period}</span>}
                    </>
                  )}
                </div>
                {s.description && (
                  <p className="text-sm text-muted-foreground mt-3 leading-relaxed line-clamp-4">{s.description}</p>
                )}
                <div className="mt-auto pt-5">
                  <Button className="w-full" onClick={() => onJoin(s)}>Join</Button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}