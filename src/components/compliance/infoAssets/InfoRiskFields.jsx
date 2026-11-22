import React from 'react';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import AutoGrowTextarea from '@/components/shared/AutoGrowTextarea';
import InfoTooltip from '@/components/risk/InfoTooltip';
import AssetBadge from '@/components/compliance/assets/AssetBadge';
import { SECURITY_CLASSIFICATION_OPTIONS, IMPACT_OPTIONS, RISK_EXPOSURE_OPTIONS } from '@/lib/infoAssetRegister';

const SECURITY = [
  ['security_classification', 'Security Classification', SECURITY_CLASSIFICATION_OPTIONS],
  ['confidentiality_impact', 'Business Impact Level - Confidentiality', IMPACT_OPTIONS, 'The potential damage or harm to the organisation if information is lost, compromised, or misused'],
  ['integrity_impact', 'Business Impact Level - Integrity', IMPACT_OPTIONS, 'The potential damage or adverse consequences to an organization if the accuracy, completeness, or validity of information or systems is compromised'],
  ['availability_impact', 'Business Impact Level - Availability', IMPACT_OPTIONS, 'The potential negative consequences when information, systems, or ICT environments become inaccessible or disrupted'],
];

function Field({ label, tip, children }) {
  return (
    <div className="space-y-1.5 min-w-0">
      <div className="flex items-center gap-1.5">
        <Label className="text-xs text-muted-foreground">{label}</Label>
        {tip && <InfoTooltip text={tip} />}
      </div>
      {children}
    </div>
  );
}

function Section({ title, className = 'space-y-4', children }) {
  return (
    <section className="rounded-xl bg-muted p-5">
      <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-4">{title}</p>
      <div className={className}>{children}</div>
    </section>
  );
}

/** Option display: coloured dot for impact levels, coloured label for preset colours. */
function OptionView({ value, opts }) {
  const opt = opts.find((o) => o.name === value);
  if (opt?.dot) return <span className="inline-flex items-center gap-2 text-sm text-foreground"><span className={`w-2.5 h-2.5 rounded-full shrink-0 ${opt.dot}`} />{value}</span>;
  return <AssetBadge value={value} options={opts} />;
}

/** Risk tab — Security Assessment and Risk Details sections. */
export default function InfoRiskFields({ values, set, edit }) {
  const select = ([k, label, opts, tip]) => (
    <Field key={k} label={label} tip={tip}>
      {edit ? (
        <Select value={values[k] || undefined} onValueChange={(v) => set(k, v)}>
          <SelectTrigger className="bg-card"><SelectValue placeholder="Select..." /></SelectTrigger>
          <SelectContent className="z-[300]">{opts.map((o) => <SelectItem key={o.name} value={o.name}><OptionView value={o.name} opts={opts} /></SelectItem>)}</SelectContent>
        </Select>
      ) : <div>{values[k] ? <OptionView value={values[k]} opts={opts} /> : <span className="text-sm text-muted-foreground">—</span>}</div>}
    </Field>
  );
  return (
    <div className="space-y-4">
      <Section title="Security Assessment" className="grid grid-cols-1 sm:grid-cols-2 gap-4">{SECURITY.map(select)}</Section>
      <Section title="Risk Details">
        {select(['risk_exposure', 'Risk Exposure', RISK_EXPOSURE_OPTIONS])}
        <Field label="Risk Details">
          {edit
            ? <AutoGrowTextarea value={values.risk_details || ''} onChange={(e) => set('risk_details', e.target.value)} placeholder="e.g., Outdated unprotected dataset" className="min-h-[72px]" />
            : <p className="text-sm text-foreground whitespace-pre-wrap break-words">{values.risk_details || '—'}</p>}
        </Field>
      </Section>
    </div>
  );
}