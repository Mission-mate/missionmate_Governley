import React from 'react';
import RiskAssessmentColumn from '@/components/risk/steps/RiskAssessmentColumn';

// Assessment scoring editor — likelihood/consequence only, no controls.
export default function RiskAssessmentScores({ form, update }) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
      <RiskAssessmentColumn
        title="Inherent Risk"
        subtitle="Risk Before Controls"
        accent="text-rose-600"
        tooltip="The level of risk before any controls or safeguards are considered. e.g. The risk if no policies, procedures, or controls were in place."
        likelihood={form.inherent_likelihood}
        consequence={form.inherent_consequence}
        onChange={({ likelihood, consequence }) =>
          update(
            likelihood !== undefined
              ? { inherent_likelihood: likelihood }
              : { inherent_consequence: consequence }
          )
        }
      />
      <RiskAssessmentColumn
        title="Residual Risk"
        subtitle="Risk After Controls"
        accent="text-emerald-600"
        tooltip="The level of risk remaining after controls and safeguards are applied. e.g. The risk that remains after policies, procedures, and controls are operating."
        likelihood={form.residual_likelihood}
        consequence={form.residual_consequence}
        onChange={({ likelihood, consequence }) =>
          update(
            likelihood !== undefined
              ? { residual_likelihood: likelihood }
              : { residual_consequence: consequence }
          )
        }
      />
    </div>
  );
}