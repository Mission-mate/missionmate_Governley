import React from 'react';
import { ArrowLeft, Check } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { resolveFee, isPaidStructure, formatFee, renewalLabel, hasSelectableTiers } from '@/lib/membershipFee';

/**
 * Step 2 — Plan detail. Shows the plan name, description and any admin-configured
 * content sections (e.g. Rights, Benefits). When the plan has tiers, the
 * applicant must pick one before continuing.
 */
export default function PlanDetailStep({ structure, selectedTierId, onSelectTier, onBack, onContinue }) {
  if (!structure) return null;
  const tiers = hasSelectableTiers(structure) ? structure.tiers : [];
  const period = renewalLabel(structure);
  const paid = isPaidStructure(structure);
  const canContinue = tiers.length === 0 || !!selectedTierId;

  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 md:px-8 py-8 md:py-10">
      <button onClick={onBack} className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground mb-6">
        <ArrowLeft className="w-4 h-4" /> Back to plans
      </button>

      <div className="bg-card border border-border rounded-xl p-5 sm:p-7 shadow-sm">
        <h2 className="text-xl sm:text-2xl font-bold text-foreground">{structure.name}</h2>
        {paid && structure.fee_type !== 'Tiered' && (
          <p className="text-lg font-semibold text-primary mt-1">
            {formatFee(resolveFee(structure))}{period && <span className="text-sm text-muted-foreground font-normal"> /{period}</span>}
          </p>
        )}
        {structure.description && (
          <p className="text-sm text-muted-foreground mt-4 leading-relaxed whitespace-pre-line">{structure.description}</p>
        )}

        {(structure.plan_content_sections || []).map((section) => (
          <div key={section.id} className="mt-6">
            <h3 className="text-sm font-bold text-foreground mb-1.5">{section.title}</h3>
            <div
              className="text-sm text-muted-foreground leading-relaxed [&_p]:text-sm [&_p]:text-muted-foreground [&_li]:text-sm [&_li]:text-muted-foreground [&_a]:text-primary [&_a]:underline"
              dangerouslySetInnerHTML={{ __html: section.content || '' }}
            />
          </div>
        ))}

        {tiers.length > 0 && (
          <div className="mt-7">
            <h3 className="text-sm font-bold text-foreground mb-3">Select a category</h3>
            <div className="space-y-2.5">
              {tiers.map((tier) => {
                const active = selectedTierId === tier.id;
                return (
                  <button
                    key={tier.id}
                    type="button"
                    onClick={() => onSelectTier(tier.id)}
                    className={`w-full text-left rounded-lg border p-4 transition-colors ${active ? 'border-primary bg-primary/5' : 'border-border hover:border-primary/50'}`}
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <p className="text-sm font-semibold text-foreground">{tier.name}</p>
                        {tier.description && <p className="text-xs text-muted-foreground mt-0.5">{tier.description}</p>}
                      </div>
                      <div className="flex items-center gap-2 shrink-0">
                        {structure.tier_fees_differ && (
                          <span className="text-sm font-semibold text-foreground">
                            {Number(tier.fee_amount) > 0 ? formatFee(tier.fee_amount) : 'Free'}
                          </span>
                        )}
                        {active && <Check className="w-4 h-4 text-primary" />}
                      </div>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>
        )}

        <Button className="w-full mt-7" disabled={!canContinue} onClick={onContinue}>
          Continue to application
        </Button>
      </div>
    </div>
  );
}