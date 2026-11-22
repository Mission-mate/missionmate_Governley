import React from 'react';
import { ArrowLeft } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { CustomFieldEdit, defaultValueForField } from '@/components/contacts/CustomFieldRenderer';
import { getSystemField, resolveCustomDef } from '@/lib/membershipForm';

// Renders a single built-in field control.
function SystemFieldInput({ def, value, onChange, placeholder }) {
  const ph = placeholder || def.label;
  if (def.type === 'Textarea') {
    return <Textarea value={value || ''} onChange={(e) => onChange(e.target.value)} rows={3} placeholder={ph} />;
  }
  const type = def.type === 'Email' ? 'email' : def.type === 'Phone' ? 'tel' : def.type === 'Date' ? 'date' : 'text';
  return <Input type={type} value={value || ''} onChange={(e) => onChange(e.target.value)} placeholder={ph} />;
}

/**
 * Step 3 — Membership application form. Shows only the questions configured to
 * appear for the selected plan.
 */
export default function ApplicationFormStep({
  structure, layout, customById, values, customValues, setVal, setCustomVal, error, onBack, onContinue,
}) {
  return (
    <div className="max-w-2xl mx-auto px-4 sm:px-6 md:px-8 py-8 md:py-10">
      <button onClick={onBack} className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground mb-6">
        <ArrowLeft className="w-4 h-4" /> Back
      </button>

      <div className="bg-card border border-border rounded-xl p-5 sm:p-7 shadow-sm">
        <h2 className="text-xl font-bold text-foreground">Membership Application</h2>
        <p className="text-sm text-muted-foreground mt-1">{structure?.name}</p>

        <div className="mt-6 space-y-5">
          {layout.map((f) => {
            const label = (
              <div className="mb-1.5">
                <Label className="block text-sm">
                  {f.label}{f.mandatory && <span className="text-destructive ml-0.5">*</span>}
                </Label>
              </div>
            );
            if (f.kind === 'system') {
              const def = getSystemField(f.field_id);
              if (!def) return null;
              return (
                <div key={f.field_id}>
                  {label}
                  <SystemFieldInput def={def} value={values[f.field_id]} onChange={setVal(f.field_id)} placeholder={f.placeholder} />
                </div>
              );
            }
            const cf = resolveCustomDef(f, customById);
            if (!cf) return null;
            return (
              <div key={f.field_id}>
                {label}
                <CustomFieldEdit
                  field={cf}
                  value={customValues[f.field_id] ?? defaultValueForField(cf)}
                  onChange={setCustomVal(f.field_id)}
                />
              </div>
            );
          })}
        </div>

        {error && <p className="text-sm text-destructive mt-4">{error}</p>}

        <Button className="w-full mt-7" onClick={onContinue}>Continue to payment</Button>
      </div>
    </div>
  );
}