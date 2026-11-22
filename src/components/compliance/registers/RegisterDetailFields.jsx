import React from 'react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import ReviewSection from './ReviewSection';
import SectionCard from '@/components/shared/SectionCard';
import FieldError from '@/components/shared/FieldError';
import { STATUSES } from '@/lib/complianceRegisters';

const SECTION_LABEL = 'text-xs font-semibold text-muted-foreground uppercase tracking-wider';

export default function RegisterDetailFields({ form, set, categories, review, errors = {} }) {
  return (
    <div className="space-y-6">
      <SectionCard title="Details" className="space-y-3">

        <div>
          <Label className="mb-1 block text-xs text-muted-foreground">
            Register Title <span className="text-destructive">*</span>
          </Label>
          <Input value={form.title} onChange={(e) => set('title', e.target.value)} placeholder="e.g. Risk Register" className="bg-white" />
          <FieldError msg={errors.title} />
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <Label className="mb-1 block text-xs text-muted-foreground">
              Category <span className="text-destructive">*</span>
            </Label>
            <Select value={form.category || ''} onValueChange={(v) => set('category', v)}>
              <SelectTrigger className="bg-white"><SelectValue placeholder="Select..." /></SelectTrigger>
              <SelectContent>
                {categories.map((c) => <SelectItem key={c} value={c}>{c}</SelectItem>)}
              </SelectContent>
            </Select>
            <FieldError msg={errors.category} />
          </div>
          <div>
            <Label className="mb-1 block text-xs text-muted-foreground">
              Owner <span className="text-destructive">*</span>
            </Label>
            <Input value={form.owner} onChange={(e) => set('owner', e.target.value)} placeholder="e.g. John Doe" className="bg-white" />
            <FieldError msg={errors.owner} />
          </div>
        </div>

        <div>
          <Label className="mb-1 block text-xs text-muted-foreground">Status</Label>
          <Select value={form.status || 'active'} onValueChange={(v) => set('status', v)}>
            <SelectTrigger className="bg-white"><SelectValue /></SelectTrigger>
            <SelectContent>
              {STATUSES.map((s) => <SelectItem key={s.value} value={s.value}>{s.label}</SelectItem>)}
            </SelectContent>
          </Select>
        </div>
      </SectionCard>

      <ReviewSection form={form} {...review} />
    </div>
  );
}