import React from 'react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import PlanContentSections from './form/PlanContentSections';
import PlanTiersConfig from './form/PlanTiersConfig';
import SectionCard from '@/components/shared/SectionCard';

export default function StructureStepInfo({ form, setForm }) {
  const set = (key) => (e) => setForm((f) => ({ ...f, [key]: e.target.value }));

  return (
    <div className="space-y-4">
      {/* Name & description */}
      <SectionCard className="space-y-4">
        <div>
          <Label className="mb-1.5 block text-sm">Membership Plan Name <span className="text-destructive">*</span></Label>
          <Input value={form.name} onChange={set('name')} placeholder="e.g., General Membership, Platinum Membership" />
        </div>

        <div>
          <Label className="mb-1.5 block text-sm">Description</Label>
          <Textarea
            value={form.description}
            onChange={set('description')}
            placeholder="Describe this membership plan. This description will appear on the membership page."
            rows={2} />
        </div>
      </SectionCard>

      {/* Additional sections */}
      <SectionCard>
        <PlanContentSections
          sections={form.plan_content_sections}
          onChange={(next) => setForm((f) => ({ ...f, plan_content_sections: next }))} />
        
      </SectionCard>

      {/* Multiple tiers */}
      <SectionCard>
        <PlanTiersConfig form={form} setForm={setForm} />
      </SectionCard>
    </div>);

}