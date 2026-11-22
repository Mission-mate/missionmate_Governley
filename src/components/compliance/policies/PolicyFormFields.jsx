import React from 'react';
import SectionCard from '@/components/shared/SectionCard';
import { DetailsInputs, OwnershipInputs, ClassificationInputs, ReviewInputs } from './PolicyFieldGroups';

export default function PolicyFormFields({ form, set, types, columns, categories, parents, parent, review, lockParent, errors }) {
  return (
    <div className="space-y-6">
      <SectionCard title="Details">
        <DetailsInputs form={form} set={set} types={types} columns={columns} categories={categories} parents={parents} parent={parent} lockParent={lockParent} errors={errors} />
      </SectionCard>
      <SectionCard title="Ownership & Approval"><OwnershipInputs form={form} set={set} errors={errors} /></SectionCard>
      <SectionCard title="Classification & Lifecycle"><ClassificationInputs form={form} set={set} /></SectionCard>
      <ReviewInputs form={form} set={set} parent={parent} review={review} errors={errors} />
    </div>
  );
}